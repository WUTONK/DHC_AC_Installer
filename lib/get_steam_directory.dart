import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:win32_registry/win32_registry.dart';//使用win32插件访问注册表

// 主函数：用于测试获取游戏根目录的功能
void main() {
  String steamInstallDirectory = findSteamInstallDirectory();
  if (steamInstallDirectory != "null") {
    print('Steam根目录： $steamInstallDirectory');
  } else {
    print('找不到Steam根目录,请手动指定安装目录');
    //todo:写一个返回弹出选择游戏根目录教程（提示）
  }
}

// 函数：获取steam安装路径
// 变量：
//   - steamInstallPath：steam路径
// 返回值：steam路径
String findSteamInstallDirectory() {
  // 默认Steam安装目录
  const String defaultSteamDirectory = 'C:\\Program Files (x86)\\Steam';
  // 查看steam是否在默认目录下
  if (Directory(defaultSteamDirectory).existsSync()) {
    return defaultSteamDirectory;
  }

  // 检查注册表获取安装路径
  try {
    const steamRegistryKey = r'Software\Valve\Steam';//steam注册表在注册表根目录下的位置
    final registryIo = Registry.openPath(RegistryHive.currentUser,path: steamRegistryKey);//RegistryHive用来打开不同的注册表根目录，currentUser为HKEY_USERS根目录
    final steamInstallPath = registryIo.getValueAsString('SteamPath');
    // 检测是否成功获取steam路径
    if (steamInstallPath != null) {
      print('steam安装位置: $steamInstallPath');
      registryIo.close();
      return steamInstallPath;
    }
  } catch (e) {
    print('无法从注册表中获取Steam安装路径，出现错误：$e');
    print("可能是你没有安装steam，本软件可能无法正常在盗版神力科莎上运行或自动获取安装路径，请手动选择安装路径");
    //TODO: 这里做个手动安装选项的跳转
  }
  return "null";
}



