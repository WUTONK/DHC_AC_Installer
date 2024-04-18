import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'package:flutter_swiper_null_safety/flutter_swiper_null_safety.dart';

void main() => runApp(new MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return new MaterialApp(
      title: 'Flutter Demo',

      home: new MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key? key, required this.title}) : super(key: key);

  final String title;

  @override
  _MyHomePageState createState() => new _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar:AppBar(title:Text("抽屉")),
      body:Center(child:Text("页面")),
       drawer: Drawer(
            child: Column(
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: DrawerHeader(
                        child: Text('这是头部图片'),
                        decoration: BoxDecoration(
                          image:DecorationImage(
                            image: NetworkImage("https://img.wutonk.xyz/avatar/WUTONK_Avatar_2022_02_dark_high-export.png"),
                            fit:BoxFit.fill
                          )
                        ),
                    ),)
                  ],
                ),
                ListTile(
                  leading: CircleAvatar(
                    child: Icon(Icons.home),
                  ),
                  title: Text("主页"),
                  onTap: (){
                    //跳转路由代码
                  },
                ),
                Divider(),
                ListTile(
                    leading:CircleAvatar(
                      child: Icon(Icons.folder),
                    ),
                    title:Text("文件")
                ),
                Divider(),
                ListTile(
                  leading: CircleAvatar(
                    child: Icon(Icons.help),
                  ),
                  title: Text("帮助"),
                )
              ],
            )
        ),
      endDrawer:Drawer(
        child: Text("右侧"),
      )
    );
  }
}
