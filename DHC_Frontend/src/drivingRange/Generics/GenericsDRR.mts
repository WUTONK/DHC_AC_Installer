function identity<T>(arg: T): T {
  return arg;
}

function normal(arg: string): void {
  console.log(arg);
}

function toArray<T>(value: T): T[] {
  return [value];
}

// examples
console.log(identity<number>(123));
console.log(identity<string>("abc"));

console.log(toArray(1));
console.log(toArray([1,2]));
console.log(toArray("x"));

normal("hello");
