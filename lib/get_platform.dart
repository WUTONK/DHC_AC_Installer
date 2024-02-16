import 'dart:io';

// 主函数：用于测试获取系统版本功能
void main(){
  SystemVersionSatisfy();
}

// 函数：获取系统是否满足运行条件（64位的win10或win11系统）
// 变量：
//   - versionString: 系统版本号，例："Windows 10 Pro" 10.0 (Build 19042)"
//   - match: 经过正则表达式过滤后的浮点版本号 例：10.0
// 返回值：是否满足版本要求
SystemVersionSatisfy() {
  bool Satisfy=false;

  if (Platform.isWindows) {
    // 检测 Windows 版本是否大于等于 Windows 10
    if (!isWindows10OrGreater() && !isWindows11OrGreater()) {
      print("警告：该应用可能无法在系统版本低于 Windows 10的电脑上正常运行。");
      return;
    }else{
      print("满足版本要求");
    }

    // 检测计算机的位数
    if(Platform.version.contains("x64")) {
      const res = "满足系统要求";
      Satisfy = true;
      return (res,Satisfy);
    }
    else if (Platform.version.contains("x86")) {
      const res ="警告：该应用不支持在 32 位系统上运行。请使用 64 位系统";
      return (res,Satisfy);
    } else {
      const res ="警告：未能检测到您的系统位数。如果你运行的是32位系统，应用将无法运行";
      return (res,Satisfy);
    }
  } else {
    const res = "肥肠爆芡，本应用不支持在windows10以下或其他系统环境下运行，不过看你都用linux玩游戏了，模组绝对可以自己装吧( •̀ ω •́ )✧";
    return (res,Satisfy);
  }
}

// 函数：获取系统版本号是否为win10
// 变量：
//   - versionString: 系统版本号，例："Windows 10 Pro" 10.0 (Build 19042)"
//   - match: 经过正则表达式过滤后的浮点版本号 例：10.0
// 返回值：是否满足版本要求
bool isWindows10OrGreater() {
  final TargetVersion=10.0; //目标版本

  final versionString = Platform.operatingSystemVersion;
  final match = RegExp(r'(\d+\.\d+)').firstMatch(versionString);
  print(match);
  if (match != null) {
    final version = double.parse(match.group(1)!); //将第一个匹配项返回，也就是版本号 
    print(version);
    if (version == TargetVersion){
      return true;
    }
  }
  print("检测到非win10系统");
  return false;
}
// 获取系统版本号是否为win11，其他同上函数
bool isWindows11OrGreater() {
  final TargetVersion=11.0; //目标版本
  
  final versionString = Platform.operatingSystemVersion;
  final match = RegExp(r'(\d+\.\d+)').firstMatch(versionString);
  if (match != null) {
    final version = double.parse(match.group(1)!);
    print(version);
    if (version == TargetVersion){
      return true;
    }
  }
  return false;
}
