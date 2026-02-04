The curious case of the conversion
##################################

:date: 2025-07-20 19:03
:tags: C++

.. image:: images/trojan.png
    :alt: mechanical trojan horse
    :class: image-process-article-image
    :align: center

A few days ago a friend sent me this riddle:

.. code-block:: c++

    #include <iostream>

    void foo(float&&) { std::cout << "f"; }
    void foo(int&&) { std::cout << "i"; }

    template <typename... T>
    void bar(T&&... v) {
        (foo(v), ...);
    }

    int main () {
        bar(1.0f, 2);
    }

What will happen?

Let's walk through it carefully.

:code:`bar` is a variadic function template taking variable number of parameters. When template parameters are deduced in this context, :code:`T&&` is a forwarding reference (it can catch both *lvalue* and *rvalue* reference). However, inside the function body each parameter :code:`v` is a named variable and therefore an *lvalue*, even if it was initialized from a *rvalue*.

:code:`(foo(v), ...)` is a left-to-right fold-expression over the comma operator. It expands the pack and calls :code:`foo` once for each :code:`v`, evaluating the calls left-to-right. So inside :code:`bar` we effectively do:

.. code-block:: c++

    foo(v1);    // where v1 = 1.f
    foo(v2);    // where v2 = 2

Wait, but there are no such functions defined! All we have are two functions :code:`foo` taking *rvalue* references.

At this point I thought it could be a compiler error. There is no function :code:`foo` taking *lvalue* reference. The only way the compiler could use defined functions is if it somehow created temporary variable inside the function calls...

And then it hit me. What about implicit conversions?

If the compiler converted :code:`1.f` into :code:`1` (creating a temporary), then it would match the :code:`foo(int&&)` signature and it would print :code:`"i"`. Then the compiler could repeat the same procedure for :code:`2`, converting it to *float*, and we would get :code:`"f"`. But would the compiler do it?

I was 50/50 sure. The compilation error would be more obvious choice, but the temporary conversion would make the riddle unexpectedly tricky.

It turned out that, indeed, the compiler does the conversions. The code compiles and prints:

.. code-block:: shell-session

    if

Compilation error
*****************

So when would we get compilation error?

.. code-block:: c++

    void foo(int&&) { std::cout << "i"; }

    template <typename... T>
    void bar(T&&... v) {
        (foo(v), ...);
    }

    int main () {
        bar(1);
    }

If there were only one function :code:`foo` matching parameter passed to :code:`bar`.

.. code-block:: shell-session

    g++ main.cc -std=c++17
    main.cc:7:6: error: no matching function for call to 'foo'
        7 |     (foo(v), ...);
        |      ^~~
    main.cc:11:5: note: in instantiation of function template specialization 'bar<int>'
    requested here
    11 |     bar(1);
        |     ^
    main.cc:3:6: note: candidate function not viable: expects an rvalue for 1st argument
        3 | void foo(int&&) { std::cout << "i"; }
        |      ^   ~~~~~
    1 error generated.

Fixed version
*************

How to fix the template? Use `perfect forwarding <https://en.cppreference.com/w/cpp/utility/forward.html>`_:

.. code-block:: c++

    template <typename... T>
    void bar(T&&... v) {
        (foo(std::forward<T>(v)), ...);
    }

Now :code:`v` keeps its value category, overload resolution does what you expect, and the output is:

.. code-block:: shell-session

    fi

What std::forward actually does
*******************************

This is basically what it looks like (simplified):

.. code-block:: c++

    template <typename T>
    constexpr T&& forward(std::remove_reference_t<T>& t) noexcept {
        return static_cast<T&&>(t);
    }

The entire trick is this cast:

.. code-block:: c++

    static_cast<T&&>(t)

Conclusion
**********

And how can you not love C++, ehh...
