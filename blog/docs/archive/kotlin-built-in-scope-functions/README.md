---
title: Kotlin Standard.kt 中的函数
date: 2021-06-24
tags: Kotlin
---

在 Kotlin 中有一个 Standard.kt 的文件，这个是 Kotlin 的标准库，里面是我们平时经常使用的函数，其中包括作用域函数、对象状态检查函数、`TODO()`函数。

## 作用域函数

在 Kotlin 中有几个作用域函数，当使用一个对象调用这些函数时，会形成一个临时作用域，可以在传入的 lambda 表达式中使用对象的上下文。

每个作用域函数的本质都很相识，在官方文档中主要从两个方面来做区别：
- 上下文对象的引用方式
- lambda 表达式的返回值

| 函数名 | 上下文对象引用 | 返回值 | 是否为扩展函数 |
| --- | --- | --- | --- |
| let | it | Lambda 表达式结果 | 是 |
| run | this | Lambda 表达式结果 | 是 |
| run | - | Lambda 表达式结果 | 不是：调用无需上下文对象 |
| with | this | Lambda 表达式结果 | 不是：把上下文对象当做参数 |
| apply | this | 上下文对象 | 是 |
| also | it | 上下文对象 | 是 |

## let

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> T.let(block: (T) -> R): R {
    // ...
    return block(this)
}
```

**let** 会将 lambda 表达式的结果作为`返回值`。let 虽然是一个扩展函数，但不会屏蔽外部对象的 this。在 lambda 表达式里面如果使用 this 所访问的是外部的对象，而不是接收者对象，因为它不是使用接收者去调用我们所传入的 lambda 表达式。

我们可以为 lambda 表达式指定一个参数，这个参数是上下文对象的引用名称，不指定时默认使用 `it` 来作为上下文对象的引用。我们经常配合空安全调用操作符 `?.` 来使用 let 调用一个可空对象的属性。

举个🌰，我们通过 JSON 字符串对象获取到一个 Food 列表，当然可能获取不到，接下来我们要对这个 Food 列表进行一些操作。如果不借助 let 我们可能会写出如下代码。

```Kotlin
val foods = jsonObj.getList("foods")
var biggest:Chestnut? = null

if (foods != null) {
    foodStorage.storeChestnut(foods)
    biggest = biggestChestnuts(foods)
}
```

如果这里的 `foods` 只是用在 if 的代码块中，并没有用于其它地方，此时就可以借助 let 来移除多余的变量定义，配合空安全调用符，我们可以在 `foods` 不为 `null` 的情况下，执行传入 lambda 表达式中的代码，并在 let 语句的最后将 `biggestChestnut(foods)` 的结果返回，Kotlin 会自动推断类型，不需要我们去进行指定。

```Kotlin
var biggest = jsonObj.getList("foods")?.let {
    foodStorage.storeChestnuts(it)
    biggestChestnut(it)
}
```

有时候 it 并不能很好体现一个对象，尤其是上下文对象是通过连续的调用获取到的，或者 let 中的代码比较长的情况下，如果我们需要增加代码的可读性，为上下文对象定义一个新变量来代替默认的 it，可以将变量名称作为 lambda 表达式参数传入，此时改参数将作为上下文对象的引用，而不能使用 `it`。

```Kotlin
var biggest = jsonObj.getList("foods")?.let { foods ->
    foodStorage.storeChestnuts(foods)
    biggestChestnut(foods)
    // do more ...
}
```

## run

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> T.run(block: T.() -> R): R {
    // ...
    return block()
}
```

**run** 和 let 一样返回值都是 lambda 表达式的结果。run 定义的函数参数 `block` 是一个无参的扩展函数，因此不会像 let 一样将当前的上下文对象 `this` 传入 `block` 中，它在 lambda 表达式中的上下文对象引用直接使用 `this`。

run 的 lambda 表达式可以不通过 `this` 直接使用上下文对象的属性，因此它在 lambda 表达式中同时包含返回值的计算和对象初始化或属性调用时，非常适合使用 run。

我们可以举个🌰来对比一下：对一颗栗子剥皮，然后获取这颗栗子的评价。

```Kotlin
// 使用 let
appraise = chestnut.let {
    it.debark() // 剥皮
    Appraisal.check(it.flavour, it.weight) // 评价
}

// 使用 run 可以更加方便调用上下文对象的属性
appraise = chestnut.run {
    debark()
    Appraisal.check(flavour, weight)
}
```

此外，run 还有一个非扩展函数的版本，可以不用在接收者对象上调用，直接执行多个语句组成的代码块。

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <R> run(block: () -> R): R {
    // ...
    return block()
}
```

## with

**with** 和 run 的作用一样，官方从语义上理解为 *“对于这个对象，执行以下操作。”*，返回值是 lambda 表达式的结果。

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> with(receiver: T, block: T.() -> R): R {
    // ...
    return receiver.block()
}
```

和 run 不同的是，with 并不是扩展函数，它将上下文对象作为参数传递，而传入的 `block` 是一个上下文对象的扩展函数，在 with 内部上下文对象作为接收者调用 `block`，因此在 lambda 表达式内部依旧可以像扩展函数的接收者一样使用 this 来访问上下文对象。

```Kotlin
appraise = with(chestnut){
    debark()
    Appraisal.check(flavour, weight)
}
```

## apply

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <T> T.apply(block: T.() -> Unit): T {
    // ...
    block()
    return this
}
```

**apply** 是一个扩展函数，上下文对象作为接收者可以直接使用 this 来访问，同时上下文对象的属性和方法都可以直接使用，这和 run、with 一样。但 apply 的返回值是上下文对象本身，因此我们可以使用 apply 在获取上下文对象时做一些附加的操作，例如对象配置。

我们试着创建一个香喷喷且已经剥了皮的栗子🌰（Chestnut）

```Kotlin
val chestnut = Chestnut().apply {
    flavour = SWEET
    debark()
}
```

## also

```Kotlin
@kotlin.internal.InlineOnly
@SinceKotlin("1.1")
public inline fun <T> T.also(block: (T) -> Unit): T {
    // ...
    block(this)
    return this
}
```

**also** 的上下文对象会作为 lambda 表达式的参数传入，使用 it 来访问，而返回值是上下文对象本身。

当我们不想屏蔽外部的 `this`，或者在获取该对象时需要使用该对象进行一些其它操作时，适合用 also。

```Kotlin
val chestnut = Chestnut().also {
    println("拿到了一个新的栗子🌰： $it")
    FoodStorage.add(it)
}
```

## 对象状态检查函数

***对象状态检查** 一词来自 [Kotlin 语言中文站文档](https://www.kotlincn.net/docs/reference/scope-functions.html)*

Kotlin 标准库中的对象状态检查函数有 2 个：`takeIf` 与 `takeUnless`。它们可以让对象状态的检查加入到调用链中。

```Kotlin
@kotlin.internal.InlineOnly
@SinceKotlin("1.1")
public inline fun <T> T.takeIf(predicate: (T) -> Boolean): T? {
    // ...
    return if (predicate(this)) this else null
}

@kotlin.internal.InlineOnly
@SinceKotlin("1.1")
public inline fun <T> T.takeUnless(predicate: (T) -> Boolean): T? {
    // ...
    return if (!predicate(this)) this else null
}
```

`takeIf` 可以作为一个对象过滤器，接收的 lambda 表达式的结果必须是 Boolean 类型，当这个结果为 `true` 时，则返回对象本身，否则返回 `null`。

```Kotlin
// 获取大于 50 的偶数
val number = Random.nextInt(100)

val result = number.takeIf {
    val r1 = it % 2 == 0
    val r2 = it > 50
    r1 && r2
}

println("number: $number | result: $result")
// number: 91 | result: null
```

而 `takeUnless` 则于 `takeIf` 相反，当结果是 `false` 时才返回对象本身，否则返回 `null`

```Kotlin
val number = Random.nextInt(100).takeUnless {
    it > 50 && it % 2 == 0
}
println("number: $number")
// number: 34
```

## TODO

Kotlin 的 `TODO()` 也是属于 Standard.kt 中的函数，它可以在我们在定义方法但逻辑暂时还不需要实现或需要先去完成其它代码的时候，代替应当存在的代码进行占位。

使用 `TODO()` 占位的方法不会因为类型或返回值这些待实现问题而被 IDEA 警告，因此即便没有正确的返回值，在编译时也不会报错，但在程序执行过程中，如果执行到了 `TODO()` 的话，会抛出一个 `NotImplementedError` 错误，来告知开发者这个地方还没有进行实现。

此外，我们还可以在 `TODO()` 中传入一个 reason 参数来提示未实现原因。

```Kotlin
fun mustTodo(): String {
    TODO("还没实现的逻辑")
}

fun main() {
    mustTodo()
}

/*
Exception in thread "main" kotlin.NotImplementedError:
    An operation is not implemented: 还没实现的逻辑
*/
```

## 参考

> [作用域函数 - Kotlin 语言中文站 (kotlincn.net)](https://www.kotlincn.net/docs/reference/scope-functions.html)
