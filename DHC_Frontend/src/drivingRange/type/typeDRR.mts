//---基础类型
type UserId = number;
type Username = string;
type IsAdmin = boolean;

const id:UserId = 114514
const name:Username = "WUTONK"
const IsAdmin:IsAdmin = true

// 作业
type NumType = number
const price:NumType = 0.1


//---联合类型

type id = string|number
type Result = "success" | "fail"

const id1:id = "114514"
const id2:id = 123

const r1:Result = 'success'
const r2:Result = 'fail'

// 作业
type Direction = 'up'|'down'|'left'|'right'
const d1:Direction = 'left'


//---交叉类型
type WithTimestamps = { createdAt: Date; updateAt: Date };
type WithId = { id:number };

type Entity = WithId & WithTimestamps

const e: Entity = {id:1, createdAt: new Date(), updateAt:new Date()}
console.log(e)

// 作业
type Person = {name: string}
type Contact = {email: string}

type PersonContact = Person & Contact
const p: PersonContact = {name:"WUTONK",email:'wjt474696120@gmail.com'}
console.log(p)


//---对象类型与可选/只读
type Config = {
  readonly appName: string;
  port?: number;
};

const cfg: Config = {appName: "Demo"};
// cfg.appName = "x"

// 作业
type Account = {
  readonly username:string;
  age?:number
}

const acc1:Account = {username:"WUTONK",age:18}
console.log(acc1)
