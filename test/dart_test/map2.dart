void main() {
  var nestedMap = {
    'outerKey1': {
      'innerKey1': 'value1',
      'innerKey2': 'value2',
    },
    'outerKey2': {
      'innerKey3': 'value3',
      'innerKey4': 'value4',
    }
  };

  // 创建一个新的嵌套 Map
  var outerKey3 = {
    'innerKey5': 'value5',
  };

  // 将outerKey3添加到outerKey1中
  nestedMap['outerKey1']['outerKey3'] = outerKey3;

  print(nestedMap['outerKey1']); // 输出：{innerKey1: value1, innerKey2: value2, outerKey3: {innerKey5: value5}}
}
