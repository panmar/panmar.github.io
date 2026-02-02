Need for speed: C++ unity builds
################################

:date: 2022-05-16 19:51
:tags: c++

.. image:: images/snail.jpg
    :alt: mechanical snail
    :class: image-process-article-image
    :align: center

As I type these words, I'm staring at the LLVM compilation screen. It has been running for an hour. What a waste of energy. I really hate long compilation times.

That's why I started using `unity builds <https://en.wikipedia.org/wiki/Unity_build>`_. A unity build consolidates all code into a single translation unit:

.. code-block:: c++

    #include "file_1.cc"
    #include "file_2.cc"
    #include "file_3.cc"
    #include "file_4.cc"
    #include "file_5.cc"

How much time can I save by organizing code in this manner? I wrote `a simple test <https://github.com/panmar/unity-builds-cmp/>`_ where I generated 10,000 files:

.. code-block:: c++

    #include <iostream>
    #include <string>
    #include <vector>
    #include <memory>
    #include <map>
    #include <set>
    #include <chrono>
    #include <functional>
    #include <random>
    #include <fstream>
    #include <thread>

    class MyTestClazzX {
    public:
        void func(const std::string& str) {
            std::cout << "Hello from class MyTestClazzX: " + str << std::endl;
        }
    };

Then I performed different compilations using normal and unity builds. Here are the results:

.. code-block:: bash

    ➜  unity-builds-cmp git:(main) ✗ python test_unity_build.py 10000
    Cleaning src/ directory
    Generating 10000 files...
    Compiling unity build... [g++]
        DONE. The process took 20.84 seconds
    Compiling unity build using... [clang++]
        DONE. The process took 10.60 seconds
    Compiling normal build using 12 cores... [clang++]
        DONE. The process took 916.86 seconds

The single-threaded unity build was about 90 times faster than the normal one, even though the normal build was utilizing multiple cores. Of course, the exact results are artificial and depend very much on the files you are compiling, but the sheer difference is astonishing.

I use unity builds for my private projects, which usually do not have more than 100 files. So, here are the results for 100:

.. code-block:: bash

    ➜  unity-builds-cmp git:(main) ✗ python test_unity_build.py 100
    Cleaning src/ directory
    Generating 100 files...
    Compiling unity build... [g++]
        DONE. The process took 0.64 seconds
    Compiling unity build using... [clang++]
        DONE. The process took 0.58 seconds
    Compiling normal build using 12 cores... [clang++]
        DONE. The process took 7.48 seconds

About 13 times faster. This is noticeable and definitely worthwhile for me. It compiles under one second without using precompiled headers, incremental builds or `pimpl <https://en.cppreference.com/w/cpp/language/pimpl>`_. A full rebuild. Each time. In under one second.

So, what about cons? Certainly, putting everything into a single translation unit can result in a big mess:

* Static clash

    Symbols with identical names and internal linkage can result in lots of *redefinition* errors.

* Macro mayhem

    Preprocessor directives now operate in a global battlefield. That innocuous :code:`#define MAX_SIZE 1024` in a source header? It might silently override a same-named constant in an unrelated subsystem.

* No unnamed namespaces

    Technically, you can use `unnamed namespace <https://en.cppreference.com/w/cpp/language/namespace#Unnamed_namespaces>`_, but everything will be put inside single one. You want to use a helper function that should only be visible in this small module? Too bad. It will be visible globally.

* Ambiguous overloads

    The C++ `overload resolution <https://en.cppreference.com/w/cpp/language/overload_resolution>`_ rules are quite complex and when everything is in one translation unit, it can lead to some surprises, e.g.:

    .. code-block:: c++

        // file_1.cc
        struct Foo {
            Foo(int var) {}
        };

        void func(Foo f) {}

        // file_2.cc
        struct Bar {
            Bar(int var) {}
        };

        void func(Bar b) {}

        // main.cc
        #include "file_1.cc"
        #include "file_2.cc"

        func(42);
    
    Results in :code:`error: call to 'func' is ambiguous`.

* External dependencies

    Due to *leaky* C++ nature, you can design all of your code in *unity-friendly* manner and it might still explode when you include some *external library*.

How do I deal with it?

Well, I am using it for my own projects written from scratch. It is easier to write code for *unity builds* from the beginning than to transform big, complex codebase into it. My ruleset:

* I organize my codebase into modules with their own namespaces and try not to break dependency rules
* I rarely use macros. And if I do, I prefix them with a module-specific identifier.
* As far as external libraries are concerned, I usually put them into separate DLLs and hope headers are written properly. Alternatively, for a small project, you might try including it directly. You never know.