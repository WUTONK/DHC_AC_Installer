import 'dart:async';
import 'dart:io';

// 压缩包格式
enum ArchiveFormat { rar, zip, sevenZip }

/// 解压缩程序
class Decompressor {
  /// 压缩包文件
  final File archiveFile;

  /// 解压目标目录
  final Directory outputDirectory;

  /// 压缩包格式
  final ArchiveFormat format;

  /// 构造函数
  Decompressor(this.archiveFile, this.outputDirectory, this.format);

  /// 解压
  Future<void> decompress() async {
    switch (format) {
      case ArchiveFormat.rar:
        await _decompressRar(archiveFile, outputDirectory);
        break;
      case ArchiveFormat.zip:
        await _decompressZip(archiveFile, outputDirectory);
        break;
      case ArchiveFormat.sevenZip:
        await _decompressSevenZip(archiveFile, outputDirectory);
        break;
    }
  }

  /// 解压 RAR 压缩包
  Future<void> _decompressRar(File archiveFile, Directory outputDirectory) async {
    // 使用 `unrar` 命令解压 RAR 压缩包
    final process = await Process.start('unrar', ['x', archiveFile.path, outputDirectory.path]);
    await process.exitCode;
  }

  /// 解压 ZIP 压缩包
  Future<void> _decompressZip(File archiveFile, Directory outputDirectory) async {
    // 使用 `unzip` 命令解压 ZIP 压缩包
    final process = await Process.start('unzip', ['-o', archiveFile.path, '-d', outputDirectory.path]);
    await process.exitCode;
  }

  /// 解压 7Z 压缩包
  Future<void> _decompressSevenZip(File archiveFile, Directory outputDirectory) async {
    // 使用 `7z` 命令解压 7Z 压缩包
    final process = await Process.start('7z', ['x', archiveFile.path, '-o', outputDirectory.path]);
    await process.exitCode;
  }
}

/// 使用示例
void main() async {
  // 创建解压目标目录
  final outputDirectory = await Directory.systemTemp.createTemp('decompressed');

  // 创建 Decompressor 实例
  final decompressor = Decompressor(
    File('/path/to/archive.rar'),
    outputDirectory,
    ArchiveFormat.rar,
  );

  // 解压
  await decompressor.decompress();

  // 打印解压完成信息
  print('解压完成！解压目录：${outputDirectory.path}');
}
