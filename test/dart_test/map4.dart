void main() {
  // 创建第一个Map
  Map<String, int> map1 = {'apple': 10, 'banana': 20};

  // 创建第二个Map
  Map<String, int> map2 = {'cherry': 15, 'date': 30};

  // 将map2添加到map1中
  map1.addAll(map2);

  // 打印合并后的Map
  print(map1); // 输出: {apple: 10, banana: 20, cherry: 15, date: 30}
}
