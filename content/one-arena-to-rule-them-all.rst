One arena to rule them all
##########################

:date: 2024-09-26 19:43
:tags: C++, data structure, algorithm

.. image:: images/one_ring.png
    :alt: the one ring with C++ code on it
    :class: image-process-article-image
    :align: center

Memory management can be painful. We can use RAII and smart pointers, but sometimes it would be nice to have a garbage collector and not to worry about it at all. Especially if you needn't pay the price of periodic stalls. What if there were a way to make memory management much simpler?

Enter the Arena
***************

An arena allocator owns one big chunk of memory and hands out parts of it linearly. An allocation is just the pointer arithmetic. There is no per-allocation free. When you are done with the arena, you reset it and all allocations disappear at once.

This pattern shows up everywhere: parsers, compilers, game frames, job systems, temporary scene data. If your objects naturally die together, an arena is often the simplest and fastest option.

So let's build one.

A simple arena
**************

The arena itself only needs to know three things: where the memory starts, how big it is, and how much of it is already used.

.. code-block:: c++

    struct ArenaAllocator {
        u8*     base;
        size_t  size;
        size_t  offset;
    };

.. code-block:: c++

    void arena_init(ArenaAllocator* allocator, void* memory, size_t size) {        
        allocator->base   = (u8*)memory;
        allocator->size   = size;
        allocator->offset = 0;
    }

The core of the allocator is the allocation function itself:

.. code-block:: c++

    void* arena_alloc(ArenaAllocator* allocator, size_t size, size_t alignment) {        
        uintptr_t current = (uintptr_t)(allocator->base + allocator->offset);
        uintptr_t aligned = align_address_forward(current, alignment);
        size_t padding = aligned - current;
        
        if (allocator->offset + padding + size > allocator->size) {
            return nullptr;
        }
        
        allocator->offset += padding + size;
        return (void*)aligned;
    }

This does three things. It aligns the current pointer, checks bounds, and bumps the offset. There is no metadata and no bookkeeping beyond that.

This helper rounds an address up to the next aligned boundary. Alignment must be power of 2 (usually 4 or 16)

.. code-block:: c++

    uintptr_t align_address_forward(uintptr_t address, size_t alignment) {
        uintptr_t mask = alignment - 1;
        return (address + mask) & ~mask;
    }

The function :code:`arena_alloc` gives you raw memory. For convenience, let's wrap it with a typed helper:

.. code-block:: c++

    template<typename T>
    T* arena_push(ArenaAllocator* allocator, u32 count = 1) {
        return (T*) arena_alloc(allocator, sizeof(T) * count, alignof(T));
    }

This works for trivial types and POD-like data. It does not call constructors or destructors. If you need that, you must explicitly use `placement new <https://en.cppreference.com/w/cpp/language/new.html#Placement_new>`_.

.. code-block:: c++

    MyType* obj = new (arena_push<MyType>(&allocator)) MyType(arg1, arg2);

Destruction is your responsibility, or you accept that destructors will never run and design your types accordingly. That trade-off is the whole point of an arena.

Freeing everything is trivial:

.. code-block:: c++

    void arena_reset(ArenaAllocator* allocator) {
        allocator->offset = 0;
    }

After this call, all previously returned pointers are invalid. The memory can be reused immediately.

Here is a complete example using `mmap <https://linux.die.net/man/2/mmap>`_ to get backing storage:

.. code-block:: c++

    u8* memory = (u8*) mmap(nullptr, 1000, PROT_READ | PROT_WRITE, MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);

    ArenaAllocator allocator;
    arena_init(&allocator, memory, 1000);
    //...
    MyData* data = arena_push<MyData>(&allocator);
    int* arr = arena_push<int>(&allocator, 50);
    //...
    arena_reset(&allocator);
    munmap(memory, 1000);

Conclusion
**********

An arena allocator lets you reason about lifetimes as a whole. When lifetimes are grouped together — per frame, per request, per parse — an arena allocator makes this reality explicit instead of pretending every object is independent.

Used in the right place, it often leads to simpler code, fewer ownership concerns, and performance that is easy to reason about. It is not magic, and it does not pretend to be. If your data already lives and dies together, it is worth stopping and asking: could this be an arena?

It is just another tool in the shed — one that deserves to be taken off the wall more often.
