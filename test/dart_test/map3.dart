void main() {
  // 创建一个嵌套的 Map
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

  // 访问嵌套的值
  print(nestedMap['outerKey1']); // 输出：{innerKey1: value1, innerKey2: value2}
  print(nestedMap['outerKey1']?['innerKey1']); // 输出：value1

  // 添加新的嵌套 Map
  var outerKey3 = <String, dynamic>{};
  nestedMap['outerKey3'] = {'innerKey5': 'value5'};

  print(nestedMap['outerKey3']); // 输出：{innerKey5: value5}
}