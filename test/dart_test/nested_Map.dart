
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
  var mirrorMap = <dynamic, dynamic>{}; //由于dart不允许遍历途中修改数据，使用镜像暂存来绕过限制

  // 递归查找目标键名，并在其所属的外部 Map 中添加新 Map
  addToOuterMap(Map nMap,mMap) {
    nMap.forEach((key, value) {
      if (key == targetKey) {
        // 在外部 Map 中添加新 Map
        mMap = {...nMap}; //**在dart中，如果直接赋值一个变量给另一个变量默认是引用而不是复制，使用扩展运算符{...}来复制**
        mMap['testKey1'] = mapToAdd;
        print('添加成功！');
        print(mMap);
        return mMap;
      } else if (value is Map) {
        // 继续递归查找
        addToOuterMap(value,mMap);
      }
    });
  }

  // 调用递归函数开始查找并添加
  addToOuterMap(nestedMap,mirrorMap);
  print(nestedMap['outerKey1']); // 输出：{innerKey1: {nestedInnerKey1: nestedValue1, nestedInnerKey2: nestedValue2, outerKey3: {nestedInnerKey9: nestedValue9}}, innerKey2: {nestedInnerKey3: nestedValue3, nestedInnerKey4: nestedValue4}}
}


// // 递归查找目标键名，并在其所属的外部 Map 中添加新 Map
//   void addToOuterMap(Map nestedMap) {
//     nestedMap.forEach((key, value) {
//       if (key == targetKey) {
//         // 在外部 Map 中添加新 Map
//         nestedMap['outerKey3'] = mapToAdd;
//         print('添加成功！');
//         print(nestedMap);
//         return;
//       } else if (value is Map) {
//         // 继续递归查找
//         addToOuterMap(value);
//       }
//     });
//   }
