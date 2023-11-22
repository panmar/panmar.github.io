Need for speed: C++ unity builds
################################

:date: 2023-11-22 11:40
:tags: c++
:status: published

As I type these words, I'm staring at the LLVM compilation screen, which has been running for about an hour. What a waste of energy. I really hate long compilation times.

To address this issue, I started using `unity builds <https://en.wikipedia.org/wiki/Unity_build>`_. They consolidate all code into a single translation unit. How much time can I save by organizing the code in this manner? I wrote `a simple test <https://github.com/panmar/unity-builds-cmp/>`_ where I generated 10000 files:

.. code-block:: C++

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
            std::cout << "Hello from class " + MyTestClassX + ": " + str << std::endl;
        }
    };

I then performed different compilations. Here are the results:

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

The single-threaded unity build was about 90 times faster than the normal one, even though the normal build was utilizing multiple cores. Of course, the exact results are artifical and depend very much on the files you are compiling, but the sheer difference is astonishing.

I use unity builds for my private projects, which consist usually of no more than 100 files. Here are the results for 100:

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

About 13 times faster. This is noticeable and definitely worthwhile for me.

You can learn more about unity builds from `Viktor Kirilov <https://onqtam.com/programming/2018-07-07-unity-builds/>`_.