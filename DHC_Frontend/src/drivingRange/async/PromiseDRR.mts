let knock!: () => void;
// let notKnock!: (reason?: unknown) => void;

// Promise分为三个状态：
// pending（进行中）fulfilled（已成功，得到结果） rejected（已失败，得到错误）（只能从左向右单向流转 不可以逆转）

const someoneKnocking = new Promise<void>((resolve,reject) => {
  knock = resolve
  // notKnock = reject;
});

setTimeout(() => {
  knock(); // 2 秒后，真的“敲门”了
  // notKnock(new Error('2 秒超时，没有人敲门'))
}, 2000);

try {
  await someoneKnocking; // 在这儿等待，直到有人“敲门”或失败
  console.log('我开门了');
} catch (error) {
  console.error('开门失败：', error);
} finally {
  console.log('流程结束');
}




export {};


