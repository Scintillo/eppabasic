<!--input-->
MouseX
======

```eppabasic
Function MouseX() As Integer
```

Palauttaa hiiren osoittimen x-koordinaatin.

[Katso, miten EppaBasicissa koordinaatisto toimii](manual:/coordinates).

Example
---------
```eppabasic
Do
    ClearScreen
    Print MouseX()
    DrawScreen
Loop
```