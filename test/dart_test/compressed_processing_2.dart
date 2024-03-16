import 'dart:async';
import 'dart:io';
import 'dart:convert';

void main() async {

  //获取项目根目录
  final projectRootPath = Directory.current.path;
  print(projectRootPath);
  final String projectRootPathString = projectRootPath.toString();
  print("项目绝对路径: ${projectRootPathString}");

  //设置文件源和输出路径
  String decompressFileSourcePath = '\\test\\compressed_test\\zip_test\\testfile_1.zip';
  String decompressFileTargetPath = '\\test\\compressed_test\\zip_test\\target';
  print("文件源路径: $decompressFileSourcePath");
  print("文件输出路径: $decompressFileTargetPath");
  //转为绝对路径
  String absoluteDecompressFileSourcePath = projectRootPathString+decompressFileSourcePath;
  String absoluteDecompressFileTargetPath = projectRootPathString+decompressFileTargetPath;
  print("文件源绝对路径: $absoluteDecompressFileSourcePath");
  print("文件输出绝对路径: $absoluteDecompressFileTargetPath");

  // 解压 rar 文件
  // await Decompressor.decompress('path/to/source.rar', 'path/to/target');

  // 解压 zip 文件
  await Decompressor.decompress(absoluteDecompressFileSourcePath, absoluteDecompressFileTargetPath);

  // 解压 7z 文件
  // await Decompressor.decompress('path/to/source.7z', 'path/to/target');

  // 使用 try-catch 捕获异常
  // try {
  //   await Decompressor.decompress('path/to/nonexistent.rar', 'path/to/target');
  // } catch (e) {
  //   print(e);
  // }

}


/// 解压程序
class Decompressor {
  
  /// 类全局变量
  static String projectRootPathString = Directory.current.path.toString(); //项目根目录
 
  /// 解压逻辑执行
  ///
  /// @param sourcePath 压缩包路径
  /// @param targetPath 解压目标路径
  /// @return Future<void>
  static Future<void> decompress(String sourcePath, String targetPath) async {
    // 检查参数
    if (sourcePath.isEmpty || targetPath.isEmpty) {
      throw ArgumentError('参数不能为空');
    }

    // 获取压缩包格式
    final format = _getFormat(sourcePath);

    // 生成命令
    final commandAndArgs = _generateCommand(format, sourcePath, targetPath);
    
    // 执行命令
    await _runCommand(commandAndArgs);

    // 打印日志
    _printLog(format, sourcePath, targetPath);
  }

  /// 获取压缩包格式
  ///
  /// @param sourcePath 压缩包路径
  /// @return String 压缩包格式
  static String _getFormat(String sourcePath) {
    final extension = sourcePath.split('.').last;
    switch (extension) {
      case 'rar':
        return 'rar';
      case 'zip':
        return 'zip';
      case '7z':
        return '7z';
      default:
        throw ArgumentError('不支持的压缩包格式');
    }
  }

  /// 生成命令
  ///
  /// @param format 压缩包格式
  /// @param sourcePath 压缩包路径
  /// @param targetPath 解压目标路径
  /// @return String 命令
  static _generateCommand(String format, String sourcePath, String targetPath) {
    
    var command = '${Decompressor.projectRootPathString}\\bin\\7z2301-extra\\7za.exe';
    print("7-zip程序路径:$command");
    final args = <String>[];

    // 根据不同格式生成不同的参数，后期可能用到
    switch (format) {
      case 'rar':
        args.addAll(['x', '-o$targetPath', sourcePath]);
        break;
      case 'zip':
        args.addAll(['x', '-o$targetPath', sourcePath]);
        break;
      case '7z':
        args.addAll(['x', '-o$targetPath', sourcePath]);
        break;
    }
    var returnList = [command, args.join(' ')];
    print(returnList);

    return returnList;
  }

  /// 执行命令
  ///
  /// @param command 命令
  /// @return Future<void>
  static Future<void> _runCommand(commandAndArgs) async {
    final command = commandAndArgs[0];
    final args = commandAndArgs[1].split(' ');
    print(args);

    final process = await Process.start(command,args);

    // 监听标准输出
    process.stdout.transform(utf8.decoder).listen((data) {
      print(data);
    });

    // 监听标准错误
    process.stderr.transform(utf8.decoder).listen((data) {
      print(data);
    });

    // 等待进程退出，监听退出码
    await process.exitCode.then((code) {
      print('Exit code: $code');
    });
  }

  /// 打印日志
  ///
  /// @param format 压缩包格式
  /// @param sourcePath 压缩包路径
  /// @param targetPath 解压目标路径
  static void _printLog(String format, String sourcePath, String targetPath) {
    print('解压完成：');
    print('格式：$format');
    print('源文件：$sourcePath');
    print('目标路径：$targetPath');
  }
}

