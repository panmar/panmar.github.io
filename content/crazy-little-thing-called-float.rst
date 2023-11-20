Crazy Little Thing Called Float
###############################

:date: 2023-11-20 16:00
:tags: c++
:status: draft

What's wrong with this C++ code?

.. code-block:: c++

    int main() {
        float f = 16777217.f;
        while (f < 16777218.f) {
            f += 1.f;
        }
        printf("%f\n", f);
    }

It will run forever.

It is pretty common knowledge that the best way to get broke is use `floats <https://en.wikipedia.org/wiki/Single-precision_floating-point_format>`_ for storing money.

Clearly, not all rational numbers can be represented as floats:

.. code-block:: c++

    printf("%1.10f\n", 0.7f); // 0.6999999881

The floats are represented less densely the farther the number is from 0.0. This means that the farther away you are from 0.0 the larger **gaps** you will encounter without any representation.

Lets look at the numbers from the first code sample:

.. code-block:: c++

    printf("%20.16f\n", 16777217.f); // 16777216.0000000000000000
    printf("%20.16f\n", 16777218.f); // 16777218.0000000000000000

Now we can see that between **16 777 216** and **16 777 218** there is a pretty large gap.
If you kept tracking your dollars as floats around 16M you would start encountering gaps as big as 2$.

How fast will those gaps grow?

At around **140 000 000** we can find gaps of size 16. At around **1 000 000 000** of size 64.

You can play with floating point numbers `here <https://float.exposed/0x4b800001>`_.