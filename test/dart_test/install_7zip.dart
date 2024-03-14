import 'dart:async';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:path/path.dart';
import 'package:win32/win32.dart';

void main() async {
  // 下载7zip安装程序
  final url = 'https://www.7-zip.org/a/7z2101-x64.exe';
  final tempFile = File(join(tempDir.path, '7z2101-x64.exe'));
  await tempFile.writeAsBytes(await _download(url));

  // 运行7zip安装程序
  final process = await Process.start(tempFile.path, ['/S'], runInShell: true);
  await process.exitCode;

  // 删除临时文件
  await tempFile.delete();

  print('7zip已成功安装');
}

Future<List<int>> _download(String url) async {
  final client = HttpClient();
  final request = await client.getUrl(Uri.parse(url));
  final response = await request.close();
  return await response.pipe(List<int>.fromBytes());
}