Trust the Source, Luke
######################

:date: 2023-11-24 17:00
:tags: c++, security
:status: draft

.. image:: /images/yoda.jpg
    :alt: Yoda
    :align: center

It is a common belief that the only documentation programmer should rely on is the source code. Some experienced programmers argue that you should only trust in the disassembly. However, I'd like to present a case where neither of these beliefs holds true.

Consider this kernel code:

.. code-block:: c++

    int x;
    void kernel_func(int index) {
        if (index < secret_bounds) {
            x = x ^ detector[secret[index] * SOME_BIG_NUMBER];
        }
    }

.. code-block:: nasm

    void kernel_func(int) PROC
            push    ebp
            mov     ebp, esp
            mov     eax, DWORD PTR _index$[ebp]
            cmp     eax, DWORD PTR int secret_bounds
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



Could we get the value of the :code:`secret[index]` provided we have only access to :code:`index` and :code:`detector[]`? According to the source code and disassembly we should not, right?

Right?

Welcome to hardware land! CPU hate doing nothing. If there is a cache miss in the branch condition :code:`index < secret_bounds`, which would make CPU stall for a while, CPU can calculate :code:`x = x ^ detector[...]` doing so called `speculative execution <https://en.wikipedia.org/wiki/Speculative_execution>`_. If the condition, fetched from the memory, was false, it would simply not commit speculative results. So what's the problem? The problem is due to speculative execution CPU would fetch :code:`detector[secret[index] * ...]` into cache, even if we did **not** meet the branch condition!

So if we evicted whole cache, executed :code:`kernel_func` making CPU do branch prediction (e.g. run it with correct :code:`index` a few times before) and ran:

.. code-block:: c++

    auto start = rdtsc();  // high-precision timer
    auto tmp = detector['A' * SOME_BIG_NUMBER];
    auto end = rdtsc();
    auto diff = end - start;

we could guess if :code:`secret[index] * SOME_BIG_NUMBER` was 'A' by simply measuring :code:`diff` (small time means it was fetched into the cache by *speculative execution*). We could then repeat the whole process for 'B', 'C', 'D', etc., and voilà!

This vulnerability, called `Spectre/Meltdown <https://meltdownattack.com>`_, has been described in more detail in `"Reading privilaged memory with a side-channel" <https://googleprojectzero.blogspot.com/2018/01/reading-privileged-memory-with-side.html>`_ by Jann Horn.

Trust no one, Luke ;)