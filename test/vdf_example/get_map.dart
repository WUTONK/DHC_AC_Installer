import 'package:vdf/vdf.dart';
import 'dart:io';
import 'dart:convert';

void main() async {
  // 定义游戏 ID 和 VDF 文件路径
  String gameId = "413150";
  String vdfFilePath = "E:\\steam\\steamapps\\libraryfolders.vdf";

  // 定义 vdfStr 变量
  String vdfStr;

  // 异步读取文件内容
  vdfStr = await GetVdfString(gameId, vdfFilePath);

  // 使用文件内容
  print(vdfStr);

  // 解析 VDF 文件
  var vdfMap = vdf.decode(vdfStr);
  print(vdfMap);
}

// 定义 GetVdfString 函数
Future<String> GetVdfString(String gameid, String vdfFilePath) async {
  // 读取文件内容
  var vdfStr = await File(vdfFilePath).readAsString();

  // 返回文件内容
  return vdfStr;
}