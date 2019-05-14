function fun(){
    this.a=5;
}

var t = new fun();
console.log(t.a)