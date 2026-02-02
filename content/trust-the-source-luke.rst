Trust the Source, Luke
######################

:date: 2022-08-01 20:30
:tags: c++, security
:status: published

.. image:: images/yoda.jpg
    :alt: Yoda
    :class: image-process-article-image
    :align: center

It is a common belief that the only documentation a programmer should rely on is the source code. Some experienced engineers argue that one should only trust the disassembly. However, I'd like to present a case where neither of these beliefs holds true.

Consider this kernel code:

.. code-block:: c++

    int x;
    void kernel_func(int index) {
        if (index < public_bounds) {
            x = x ^ detector[secret[index] * SOME_BIG_NUMBER];
        }
    }

.. code-block:: nasm

    void kernel_func(int) PROC
        push    ebp
        mov     ebp, esp
        mov     eax, DWORD PTR _index$[ebp]
        cmp     eax, DWORD PTR int public_bounds
        jge     SHORT $LN1@kernel_fun
        mov     ecx, DWORD PTR _index$[ebp]
        mov     edx, DWORD PTR int * secret[ecx*4]
        imul    edx, DWORD PTR int SOME_BIG_NUMBER
        mov     eax, DWORD PTR int x
        xor     eax, DWORD PTR int * detector[edx*4]
        mov     DWORD PTR int x, eax
    $LN1@kernel_fun:
        pop     ebp
        ret     0



Could we obtain the value of the :code:`secret[index]` for indices outside of :code:`public_bounds`, if we only have access to :code:`index`, :code:`detector[]` and the value of :code:`SOME_BIG_NUMBER`? According to the source code and disassembly we should not, right?

Right?

Welcome to hardware land! The CPU hates idleness. If there is a cache miss in the branch condition :code:`index < public_bounds`, which would make CPU stall for a while, CPU can `speculatively execute <https://en.wikipedia.org/wiki/Speculative_execution>`_ :code:`x = x ^ detector[secret[index] * ...]`. If the condition, fetched from memory, turns out to be false, the CPU simply doesn't commit the speculative result. So, what's the issue? The problem arises because the CPU can fetch :code:`detector[secret[index] * ...]` into the cache, even if the branch condition is **not** met!

In the user process, we could have evicted the entire cache, executed :code:`kernel_func` making CPU do branch prediction (by running it with a valid :code:`index` a few times beforehand), and then executed:

.. code-block:: c++

    auto start = __rdtsc();  // high-precision timer
    auto tmp = detector['A' * SOME_BIG_NUMBER];
    auto end = __rdtsc();
    auto diff = end - start;

In this manner, we could have determined if :code:`secret[index]` was 'A' simply by measuring the time difference (a small time indicates it was fetched into the cache by *speculative execution*). We could repeat the entire process for 'B', 'C', 'D', etc., and voilà!

This vulnerability, called `Spectre <https://meltdownattack.com>`_, has been described in more detail in `"Reading privileged memory with a side-channel" <https://googleprojectzero.blogspot.com/2018/01/reading-privileged-memory-with-side.html>`_ by Jann Horn.

Be careful where you place your trust.