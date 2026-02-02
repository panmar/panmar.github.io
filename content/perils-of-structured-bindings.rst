Perils of structured bindings
#############################

:date: 2025-03-17 19:43
:tags: C++

.. image:: images/dog-and-crack.png
    :alt: a small dog near deep crack
    :class: image-process-article-image
    :align: center

C++17 introduced `structured bindings <https://en.cppreference.com/w/cpp/language/structured_binding.html>`_:

.. code-block:: c++

    auto [a, b] = func();

It looks innocent and convenient. You can think of it as:

.. code-block:: c++

    auto __tmp = func();
    // a and b are lvalue references to __tmp's members

There are two distinct steps here. First, :code:`func()` produces a temporary.
At this level, *copy elision* usually applies. Second, the bindings are initialized from that temporary.
Here, things get less friendly.

Consider this example:

.. code-block:: c++

    B func_ext() {
        auto [a, b] = func();   // RVO here
        return b;               // no NRVO here!
    }

Imagine :code:`b` is a big structure. Returning :code:`b` looks cheap. It isn’t. :code:`b` is a named object. It is no longer the function’s return value. The compiler has to copy or move it.

Now compare this with a more traditional approach:

.. code-block:: c++

    B func_ext() {
        A a;
        B b;
        func(&a, &b);
        return b;               // NRVO here
    }

Here, :code:`b` is constructed directly as the return object.
No detour. No extra copy.

Why does this happen?
*********************

When you call a function that returns a large object, the caller allocates space on its own stack and passes a hidden pointer to the callee:

.. code-block:: nasm

    func:
        sub rsp, sizeof(B)      ; make space for return value
        lea rdi, [rsp]          ; pass pointer to that space as hidden first argument
        call func_ext
        ; now [rsp] contains the B object

The callee receives this pointer and constructs the return value at that address:

.. code-block:: nasm

    func_ext:
        ; rdi = pointer to where caller wants the result
        ; construct B at address rdi
        ret

The "return slot" is just that space the caller allocated. The caller decides where it is. The callee must use it. When the compiler sees:

.. code-block:: c++

    B func_ext() {
        A a;
        B b;
        func(&a, &b);
        return b;
    }

It realizes :code:`b` will become the return value. So instead of giving :code:`b` its own space on :code:`func_ext`'s stack, it uses the pointer the caller provided. :code:`b` is constructed directly where the caller wants it. When the function returns, there's nothing to copy — :code:`b` and the return value are the same object at the same address.

Why subobjects break this?

.. code-block:: c++

    B func_ext() {
        auto [a, b] = func();
        return b;
    }

The hidden temporary looks like this in memory:

.. code-block:: text

    func_ext's stack frame:
        ┌─────────────────┐
        │      ...        │
        ├─────────────────┤ 0x7fff1000
        │       a         │   <- __tmp starts here
        ├─────────────────┤ 0x7fff1008
        │       b         │   <- b is at __tmp + 8
        ├─────────────────┤
        │      ...        │
        └─────────────────┘

Meanwhile, the caller said "put the return value at :code:`0x7fff2050`" (some address in the caller's frame). For NRVO to work, :code:`b` would need to exist at :code:`0x7fff2050`. But :code:`b`'s address is :code:`0x7fff1008` — it's determined by where :code:`__tmp` lives plus a fixed offset.

Could the compiler fix this?

You might ask: why not place :code:`__tmp` such that :code:`b` lands at :code:`0x7fff2050`?
That would put :code:`__tmp` at :code:`0x7fff2048` (so that :code:`__tmp + 8 = 0x7fff2050`). But then a would occupy :code:`0x7fff2048` — memory that's in the caller's stack frame, not ours. We'd be writing into memory we don't own. The caller only promised that :code:`0x7fff2050` is valid for a :code:`b`. It made no guarantees about the bytes before it.

A subobject's address is derived from its parent's address. The return slot's address is chosen by the caller. These are two independent constraints on where :code:`b` must live, and you can't satisfy both. Hence, a copy:

.. code-block:: nasm

    ...
    mov     rdx, QWORD PTR [rbp-16]
    mov     rax, QWORD PTR [rbp-152]
    mov     rsi, rdx
    mov     rdi, rax
    call    B::B(B const&) [complete object constructor]
    ...

Conclusion
**********

Structured bindings are elegant. They also hide costs. If performance matters, don’t trust the surface syntax. Check the generated code. The disassembly rarely lies.
