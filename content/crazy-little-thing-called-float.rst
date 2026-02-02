Crazy Little Thing Called Float
###############################

:date: 2021-11-20 11:28
:tags: ieee-754

.. image:: images/ladder.jpg
    :alt: ladder with missing steps
    :class: image-process-article-image
    :align: center

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

It's pretty common knowledge that the best way to go broke is to use `floats <https://en.wikipedia.org/wiki/Single-precision_floating-point_format>`_ for storing money. Indeed, not all rational numbers can be represented as floating-point numbers:

.. code-block:: c++

    printf("%1.10f\n", 0.7f); // 0.6999999881

Floats use a sign, exponent, and significand (mantissa) to represent real numbers. These gaps exist because floating-point numbers have **fixed precision** but **variable scale**:

.. math::
    value = (-1)^{sign} \cdot 2^{exponent - 127} \cdot (1 + fraction)

A 32-bit float has:

* 1 bit for the sign
* 8 bits for the exponent
* 23 bits for the significand (with an implicit leading bit, giving 24 bits of precision)

Because the fraction has only 23 explicit bits, it can only store 24-bit precision at any given scale. This means that numbers are spaced uniformly within a power of two, but the step size doubles every time the exponent increases. Therefore, floating-point numbers not only have gaps, but the distribution of these gaps is also not uniform. The farther away from 0.0, the larger empty spaces we can expect.

Let's look at the numbers from the first code sample:

.. code-block:: c++

    printf("%20.16f\n", 16777217.f);    // 16777216.0000000000000000
    printf("%20.16f\n", 16777218.f);    // 16777218.0000000000000000

Between **16,777,216** and **16,777,218**, there is a pretty large gap.
If you kept tracking your dollars as floats around 16 million, there would be gaps as big as **$2**. At around **140,000,000** we can find gaps of size **$16**. At around **1,000,000,000** of size **$64**.

The gap size depends on the exponent. Every time the number doubles, the gap size doubles:

* for numbers in the range **[1, 2)**, the gap is 2\ :sup:`-23` = 0.00000011920928955078125
* at **8,388,608**, the gap is **1**
* at **16,777,216**, the gap is **2**
* at **134,217,728**, the gap is **16**
* at **1,073,741,824**, the gap is **64**.

The pattern follows:

.. math::
    gap = 2^{exponent - 23}

====================================  ==============  =======================
Value Range                             Exponent e     Gap size
====================================  ==============  =======================
[1, 2)                                  0              2\ :sup:`-23`
[2, 4)                                  1              2\ :sup:`-22`
[4, 8)                                  2              2\ :sup:`-21`
[8,388,608, 16,777,216)                 23                   1
[16,777,216, 33,554,432)                24                   2
[134,217,728, 268,435,456)              27                  16
[1,073,741,824, 2,147,483,648)          30                  64
====================================  ==============  =======================

You can play with floating-point representation using this nice `tool <https://float.exposed/0x4b800001>`_.