
void main() {
  var nestedMap = {
    'outerKey1': {
      'innerKey1': {
        'nestedInnerKey1': 'nestedValue1',
        'nestedInnerKey2': 'nestedValue2',
      },
      'innerKey2': {
        'nestedInnerKey3': 'nestedValue3',
        'nestedInnerKey4': 'nestedValue4',
      },
    },
    'outerKey2': {
      'innerKey3': {
        'nestedInnerKey5': 'nestedValue5',
        'nestedInnerKey6': 'nestedValue6',
      },
      'innerKey4': {
        'nestedInnerKey7': 'nestedValue7',
        'nestedInnerKey8': 'nestedValue8',
      },
    },
  };

  var targetKey = 'innerKey1'; // 目标 Map 的键
  var mapToAdd = {'nestedInnerKey9': 'nestedValue9'}; // 要添加的新 Map

  // 递归查找目标键名，并在其所属的外部 Map 中添加新 Map
  void addToOuterMap(Map nestedMap) {
    nestedMap.forEach((key, value) {
      if (key == targetKey) {
        // 在外部 Map 中添加新 Map
        nestedMap['outerKey3'] = mapToAdd;
        print('添加成功！');
        print(nestedMap);
        return;
      } else if (value is Map) {
        // 继续递归查找
        addToOuterMap(value);
      }
    });
  }

  // 调用递归函数开始查找并添加
  addToOuterMap(nestedMap);
  print(nestedMap['outerKey2']); // 输出：{innerKey1: {nestedInnerKey1: nestedValue1, nestedInnerKey2: nestedValue2, outerKey3: {nestedInnerKey9: nestedValue9}}, innerKey2: {nestedInnerKey3: nestedValue3, nestedInnerKey4: nestedValue4}}
}



