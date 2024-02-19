
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

  var targetKey = 'innerKey3'; // 目标 Map 的键
  var mapToAdd = {'nestedInnerKey9': 'nestedValue9'}; // 要添加的新 Map
  var mirrorMap = <dynamic, dynamic>{}; //由于dart不允许遍历途中修改数据，使用镜像暂存来绕过限制

  // 递归查找目标键名，并在其所属的外部 Map 中添加新 Map，如果始终没有查找到，返回Null
    Map<dynamic, dynamic>? addToOuterMap(Map nMap,mMap) {
      
      var testValue = {'a':1};
      bool foundKey = false;
      mMap = {...nMap}; //**在dart中，如果直接赋值一个变量给另一个变量默认是引用而不是复制，使用扩展运算符{...}来复制**

      void recursiveAdd(Map map) {
        for (var entry in map.entries) {
          var key = entry.key;
          var value = entry.value;
          if (key == targetKey) {
            // 在外部 Map 中添加新 Map
            mMap['testKey1'] = mapToAdd;
            print('添加成功！');
            print(mMap);
            foundKey = true;
            break;
          } else if (value is Map && !foundKey) {
            // 继续递归查找
            addToOuterMap(value,mMap);
          }
        };
        return;
      }

      recursiveAdd(nMap);
      
      if (foundKey) {
        return testValue;
      } else {
        return null;
      }

    }

  // 调用递归函数开始查找并添加
  var a = addToOuterMap(nestedMap,mirrorMap);
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
