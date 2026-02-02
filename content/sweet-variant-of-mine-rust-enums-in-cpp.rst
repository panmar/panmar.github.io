Sweet Variant o’ Mine
#####################

:date: 2023-02-11 16:48
:tags: C++

.. image:: images/cameleon.jpeg
    :alt: mechanical cameleon
    :class: image-process-article-image
    :align: center

Rust’s `enums <https://doc.rust-lang.org/stable/book/ch06-01-defining-an-enum.html?highlight=enum#enum-values>`_ (or should I say *tagged unions*) are a powerful tool for representing data that can take multiple forms, each with its own type and constructor.

For example, consider a **Message** that encapsulates different message types:

.. code-block:: Rust

    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        ChangeColor(i32, i32, i32),
    }

Here, each variant can hold distinct data types, from no data (**Quit**) to complex structures (**Move**). Pattern matching with **match** ensures exhaustive handling of all cases at compile time, blending flexibility with safety:

.. code-block:: Rust

    fn handle_message(msg: Message) {
        match msg {
            Message::Quit => println!("Quit"),
            Message::Move { x, y } => println!("Move to ({}, {})", x, y),
            // ... other variants handled explicitly
        }
    }

In C++, `std::variant <https://en.cppreference.com/w/cpp/utility/variant>`_ (since C++17) can mimic this behavior — but not without some boilerplate. First, define individual types for each variant:

.. code-block:: C++

    struct Quit {};
    struct Move { int x, y; };
    struct Write { std::string s; };
    struct ChangeColor { int r, g, b; };

    using Message = std::variant<Quit, Move, Write, ChangeColor>;

Handling the variant requires a visitor - often using `std::visit <https://en.cppreference.com/w/cpp/utility/variant/visit>`_ and a helper overloaded to combine lambdas:

.. code-block:: C++

    // helper type for the visitor
    template<class... Ts>
    struct overloaded : Ts... { using Ts::operator()...; };

    // explicit deduction guide (not needed as of C++20)
    template<class... Ts>
    overloaded(Ts...) -> overloaded<Ts...>;

    void handle_message(const Message& msg) {
        std::visit(overloaded{
            [](const Quit&) { printf("Quit\n"); },
            [](const Move& m) { printf("Move to (%d, %d)\n", m.x, m.y); },
            // ... other cases
        }, msg);
    }

Let’s be real: C++’s **variant** won’t match Rust enums for elegance. But that’s C++ in a nutshell - it hands you the tools to solve nearly any problem, even if the solution is a little rough around the edges. Yes, defining structs and writing visitors with overloaded lambdas is boilerplate-heavy, but it’s there if you ever need it. Just don't overuse it.