import 'package:vdf/vdf.dart';
import 'dart:io';
import 'dart:convert';

void main() async {
  // 定义游戏 ID 和 VDF 文件路径
  final gameId = 244210;
  // TODO：和get_steam_directory联通，自动获取路径
  // String libraryFoldersFilePath = "E:\\steam\\steamapps\\libraryfolders.vdf";
  String libraryFoldersFilePath = "test\\vdf_example\\libraryfolders.vdf";

  // 定义 vdfStr 变量
  String libraryFoldersStr;

  // 异步读取vdf文件内容
  libraryFoldersStr = await GetVdfString(libraryFoldersFilePath);

  // 检测文件内容
  print(libraryFoldersStr);

  // 解析 VDF 文件
  var libraryFolders = vdf.decode(libraryFoldersStr);
  print(libraryFolders);

  final path = getGameStoragePath(libraryFolders, gameId);
  if (path != null) {
    print('游戏 "${gameId}" 存储在 "${path}"');
  } else {
    print('未找到游戏 "${gameId}"');
  }
}

// 定义 GetVdfString 函数
Future<String> GetVdfString(String vdfFilePath) async {
  // 读取文件内容
  var vdfStr = await File(vdfFilePath).readAsString();

  // 返回文件内容
  return vdfStr;
}

/// 获取 Steam 游戏存储路径
///
/// 参数：
///   libraryFolders: `libraryfolders.vdf` 文件内容解析后的 Map 对象
///   gameId: 目标游戏 ID
///
/// 返回值：
///   游戏存储路径，如果未找到则返回 null
String? getGameStoragePath(Map<String, dynamic> libraryFolders, int gameId) {
  // 遍历所有存储盘
  for (var i = 0; i < libraryFolders['libraryfolders'].length; i++) {
    final folder = libraryFolders['libraryfolders'][i.toString()];
    print(folder);

    // 获取存储盘路径
    final path = folder['path'];

    // 检查该存储盘是否存在目标游戏
    if (folder['apps'].containsKey('$gameId')) {
      // 找到游戏，返回存储盘路径
      return path;
    }
  }

  // 未找到游戏
  return null;
}



///TODO:下面是之前残留的代码，把类似的检测逻辑做出来
// String getGameRootDirectory(String vdfFilePath, String gameId) {
//   // 读取VDF文件
//   File file = File(vdfFilePath);
//   if (!file.existsSync()) {
//     return '错误：未能找到VDF文件，可能是由于你安装的是盗版神力科莎，如果仍要安装，请手动指定安装目录'; // 如果文件不存在，返回错误信息
//   }

// }



