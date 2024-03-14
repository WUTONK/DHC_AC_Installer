import 'dart:io';

void main() async {
  // 1. 传入要解压的压缩包路径和解压目标路径
  final String zipPath = '/path/to/archive.zip';
  final String targetPath = '/path/to/target';

  // 2. 创建解压器
  final archiver = _getArchiver(zipPath);

  // 3. 解压文件
  await archiver.extract(targetPath);

  // 4. 打印解压日志
  for (final file in archiver.entries) {
    final String filePath = file.path;
    final String targetFilePath = '$targetPath/$filePath';
    print('解压文件: $filePath -> $targetFilePath');
  }

  print('解压完成');
}

/// 根据压缩包路径获取解压器
Archiver _getArchiver(String zipPath) {
  final String extension = Path.extension(zipPath);
  switch (extension) {
    case '.zip':
      return ZipDecoder();
    case '.rar':
      return RarDecoder();
    case '.7z':
      return SevenZipDecoder();
    default:
      throw ArgumentError('Unsupported archive format: $extension');
  }
}

/// 解压器基类
abstract class Archiver {
  /// 解压文件到目标路径
  Future<void> extract(String targetPath);

  /// 获取解压文件列表
  Iterable<ArchiveEntry> get entries;
}

/// Zip 解压器
class ZipDecoder extends Archiver {
  final ZipFile _zipFile;

  ZipDecoder() : _zipFile = ZipFile.openSync(zipPath);

  @override
  Future<void> extract(String targetPath) async {
    await _zipFile.extractAll(targetPath);
  }

  @override
  Iterable<ArchiveEntry> get entries => _zipFile.entries;
}

/// Rar 解压器
class RarDecoder extends Archiver {
  final RarFile _rarFile;

  RarDecoder() : _rarFile = RarFile.openSync(zipPath);

  @override
  Future<void> extract(String targetPath) async {
    await _rarFile.extractAll(targetPath);
  }

  @override
  Iterable<ArchiveEntry> get entries => _rarFile.entries;
}

/// 7z 解压器
class SevenZipDecoder extends Archiver {
  final SevenZipFile _sevenZipFile;

  SevenZipDecoder() : _sevenZipFile = SevenZipFile.openSync(zipPath);

  @override
  Future<void> extract(String targetPath) async {
    await _sevenZipFile.extractAll(targetPath);
  }

  @override
  Iterable<ArchiveEntry> get entries => _sevenZipFile.entries;
}

/// 压缩包条目
class ArchiveEntry {
  final String path;

  ArchiveEntry(this.path);
}
