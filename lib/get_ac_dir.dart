import 'dart:io';
import 'dart:convert';

// 函数：获取指定游戏的根目录
// 参数：
//   - vdfFilePath: VDF文件的路径
//   - gameId: 指定游戏的ID
// 返回值：游戏的根目录（如果找到），否则返回空字符串
String getGameRootDirectory(String vdfFilePath, String gameId) {
  // 读取VDF文件
  File file = File(vdfFilePath);
  if (!file.existsSync()) {
    return '错误：未能找到VDF文件，可能是由于你安装的是盗版神力科莎，如果仍要安装，请手动指定安装目录'; // 如果文件不存在，返回错误信息
  }

  // 解析VDF文件
  Map<String, dynamic> vdfData = _parseVDF(file.readAsStringSync());
  String rootDirectory = '';


  return rootDirectory; // 返回游戏根目录
}

// parseVDF函数：解析VDF格式的数据
// 参数：vdfString - VDF格式的字符串
// 返回值：解析后的Map对象
Map<String, dynamic> _parseVDF(String vdfString) {
  Map<String, dynamic> result = {}; // 存储解析结果的Map
  List<String> lines = LineSplitter.split(vdfString).toList(); // 将字符串按行分割为列表
  List<String> stack = []; // 用于跟踪解析过程中的嵌套结构


  return result; // 返回解析后的Map
}

void main() {
  String gameId = "413150"; // 要查找的游戏ID
  String vdfFilePath = "E:\\steam\\steamapps\\libraryfolders.vdf"; // VDF文件路径

  // 调用函数获取游戏根目录
  String gameRootDirectory = getGameRootDirectory(vdfFilePath, gameId);
  
  // 打印结果
  print('游戏根目录在"$gameId" is: $gameRootDirectory');
}
