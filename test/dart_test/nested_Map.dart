
/// 获取 Steam 游戏存储路径
///
/// 参数：
///   libraryFolders: `libraryfolders.vdf` 文件内容解析后的 Map 对象
///   gameId: 目标游戏 ID
///
/// 返回值：
///   游戏存储路径，如果未找到则返回 null

void main(){

  final libraryFolders = {
    'libraryfolders': {
      '0': {
        'path': 'E:\\steam',
        'apps': {
          '244210': '44949522749',
        },
      },
      '1': {
        'path': 'C:\\SteamLibrary',
        'apps': {},
      },
    },
  };
  final gameId = 244210;

  final path = getGameStoragePath(libraryFolders, gameId);
  if (path != null) {
    print('游戏 "${gameId}" 存储在 "${path}"');
  } else {
    print('未找到游戏 "${gameId}"');
  }

}

String? getGameStoragePath(Map<String, dynamic> libraryFolders, int gameId) {
  // 遍历所有存储盘
  for (var i = 0; i < libraryFolders['libraryfolders'].length; i++) {
    String intI = i.toString();
    final folder = libraryFolders['libraryfolders'][intI];
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

