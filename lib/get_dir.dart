import 'dart:convert';
import 'dart:io';

void main() {
  getAcPath();
}

void getAcPath() {
  var vdfFilePath = 'E:\\steam\\steamapps\\libraryfolders.vdf'; // 将此处替换为您的VDF文件路径

  // 读取VDF文件
  var vdfFile = File(vdfFilePath);
  if (!vdfFile.existsSync()) {
    print('VDF文件不存在。');
    return;
  }

  var vdfContent = vdfFile.readAsStringSync();

  // 获取游戏路径
  var vdfMap = _vdfToMap(vdfContent);

}

Map<String, dynamic> _vdfToMap(String vdfContent) {
  var lines = LineSplitter.split(vdfContent).toList(); // 按行分割VDF内容
  var vdfData = <String, dynamic>{}; // 存储VDF数据的Map
  var stack = <Map<String, dynamic>>[]; // 用于模拟堆栈的列表，存储当前正在处理的层级的Map
  var mapName = '';

  stack.add(vdfData); // 将根Map添加到堆栈中
  print(stack);

  for (var line in lines) {
    print(mapName);
    line = line.trim(); // 去除首尾空格
    if (line.isEmpty){
      continue; // 跳过空行
    }
    
    //如果行以'"'开始
    if (line.startsWith('"')) {
      var parts = line.split('\t'); // 使用制表符分割键值对
      var key = parts[0].replaceAll('"', ''); // 获取键并移除引号

      //map名称后没有字符，所以会异常，利用此特性获取子集名
      try {
        var value = parts[2].replaceAll('"', ''); 
      } catch (e) {
        print('获取值失败，其可能是子集名');
        mapName = key.toString();
        continue;
      }

      var value = parts[2].replaceAll('"', '');
      stack.last[key] = value; // 在堆栈顶部(last)的Map中添加键值对
      print(stack);
      
    } else if (line == '{') { //如果如果行以'{'开始
      if(mapName != ''){
      print(stack);
      var newMap = <String, dynamic>{}; // 创建一个新的Map表示新的层级
      stack.last[mapName] = newMap; // 将新的Map添加到当前层级的Map中，命名为之前获取的子集名
      print(stack);
      // stack.add(newMap); // 将新的Map推入堆栈
      // print(stack);
      }else{
        print("未能获取到子集名mapName，无法添加集合");
      }
    } else if (line == '}') { 
      stack.removeLast(); // 当前层级处理完毕，从堆栈中移除
    }
  }

  return vdfData; // 返回转换后的map数据
}
