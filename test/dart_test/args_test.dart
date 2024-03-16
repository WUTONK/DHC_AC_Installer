void main(){
  final command = '.bin\\7zr.exe';
   final args = <String>[];
   args.addAll(['x', '-o', 'targetPath', 'sourcePath']);
   print('$command ${args.join(' ')}');
}