Smells like template instantiation
##################################

:date: 2026-01-03 21:43
:tags: C++

.. image:: images/bonsai.png
    :alt: bonsai tree
    :class: image-process-article-image
    :align: center

I've recently listened to a `Wookash podcast <https://www.youtube.com/watch?v=Le8iafkLxNo>`_ with `Andreas Fredriksson <https://www.linkedin.com/in/🌮-andreas-fredriksson-287811164/>`_ — Engine Lead at Insomniac. One line stuck with me: when working on his engine Andreas tries to keep each header file as small as possible so he can iterate on a single source file without much recompilation. One way he achieves that is by reducing the number of template definitions in headers.

Normally, templates have to live in headers, because the compiler needs to see the full definition at the point of use.

.. code-block:: c++

    // t.h
    template <typename T>
    void my_template(T& t) {
        //...
    }

So if you have two source files using the same template instantiated with the same type, the templated function will be duplicated.

.. code-block:: c++

    // a.cc
    #include "t.h"

    my_template<A>(a);

.. code-block:: c++

    // b.cc
    #include "t.h"

    my_template<A>(a);

If we compile this code:

.. code-block:: shell-session

    g++ -c a.cc b.cc

And look for :code:`my_template` definitions (T = text section):

.. code-block:: shell-session

    nm -C a.o | grep -i my_template
    0000000000000024 T void my_template<A>(A&)

    nm -C b.o | grep -i my_template
    0000000000000024 T void my_template<A>(A&)

We see that every translation unit that uses a template instantiates its own copy. More headers lead to more copies, which often make compile times skyrocket. Even if the linker later merges the duplicates, the milk is already spilled — the template was compiled multiple times.

Explicit templates
******************

This is where `explicit templates <https://en.cppreference.com/w/cpp/language/function_template#Explicit_instantiation>`_ come in. Instead of letting every source instantiate templates implicitly, you can choose one place to do it explicitly:

.. code-block:: c++

    // t.h
    template <typename T>
    void my_template(T& t);

    extern template void my_template<A>(A&);
    extern template void my_template<B>(B&);

.. code-block:: c++

    // t.cc
    #include "my_header.h"

    template <typename T>
    void my_template(T& t) {
        // implementation
    }

    // explicit instantiations
    template void my_template<A>(A&);
    template void my_template<B>(B&);

Now users of :code:`my_template<>` don’t need the full definition. They just include the header, and the compiler links against the already-instantiated version.

If we were to compile this version:

.. code-block:: shell-session

    g++ -c t.cc a.cc b.cc

And look for :code:`my_template` definitions (T = text section) in t.cc

.. code-block:: shell-session

    nm -C t.o | grep -i my_template
    0000000000000000 T void my_template<A>(A&)
    0000000000000044 T void my_template<B>(B&)

We would find definitions of explicitly specialized templates.

Now if we were to check other object files (U = Undefined reference):

.. code-block:: shell-session

    nm -C a.o | grep -i my_template
                     U void my_template<A>(A&)

.. code-block:: shell-session

    nm -C b.o | grep -i my_template
                     U void my_template<B>(B&)

We see that the symbol is used, but not defined there — it will be resolved by the linker.

Closing thoughts
****************

So when to use it? For generic containers meant to store many different types, or for public API that need to stay flexible, standard templates are still the right tool. But for internal code, or for cases with a clearly fixed set of types (like :code:`vec3<float>` or :code:`vec2<int>`), explicit template instantiation is very much worth considering.

