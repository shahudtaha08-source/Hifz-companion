import 'package:flutter/material.dart';
import 'core/app_theme.dart';
import 'features/home/home_page.dart';
import 'features/hifz/hifz_page.dart';
import 'features/mutashabihat/mutashabihat_page.dart';
import 'features/quran/quran_reader_page.dart';
import 'features/tasbih/tasbih_page.dart';

void main() => runApp(const MiqraApp());

class MiqraApp extends StatefulWidget { const MiqraApp({super.key}); @override State<MiqraApp> createState()=>_MiqraAppState(); }
class _MiqraAppState extends State<MiqraApp> {
  ThemeMode _themeMode=ThemeMode.system;
  void _toggleTheme(){setState((){final dark=WidgetsBinding.instance.platformDispatcher.platformBrightness==Brightness.dark; final current=_themeMode==ThemeMode.dark||(_themeMode==ThemeMode.system&&dark); _themeMode=current?ThemeMode.light:ThemeMode.dark;});}
  @override Widget build(BuildContext context)=>MaterialApp(debugShowCheckedModeBanner:false,title:'Miqra',theme:AppTheme.light,darkTheme:AppTheme.dark,themeMode:_themeMode,home:AppShell(onToggleTheme:_toggleTheme));
}
class AppShell extends StatefulWidget { const AppShell({super.key,required this.onToggleTheme}); final VoidCallback onToggleTheme; @override State<AppShell> createState()=>_AppShellState(); }
class _AppShellState extends State<AppShell>{ int index=0; void _navigate(int v)=>setState(()=>index=v); @override Widget build(BuildContext context){ final pages=[HomePage(onNavigate:_navigate,onToggleTheme:widget.onToggleTheme),const QuranReaderPage(),const HifzPage(),const MutashabihatPage(),const TasbihPage()]; return Scaffold(body:SafeArea(child:IndexedStack(index:index,children:pages)),bottomNavigationBar:NavigationBar(selectedIndex:index,onDestinationSelected:_navigate,destinations:const[NavigationDestination(icon:Icon(Icons.home_outlined),selectedIcon:Icon(Icons.home_rounded),label:'Home'),NavigationDestination(icon:Icon(Icons.menu_book_outlined),selectedIcon:Icon(Icons.menu_book_rounded),label:'Quran'),NavigationDestination(icon:Icon(Icons.auto_graph_outlined),selectedIcon:Icon(Icons.auto_graph_rounded),label:'My Hifz'),NavigationDestination(icon:Icon(Icons.auto_awesome_motion_outlined),selectedIcon:Icon(Icons.auto_awesome_motion_rounded),label:'Mutashabihat'),NavigationDestination(icon:Icon(Icons.add_circle_outline),selectedIcon:Icon(Icons.add_circle_rounded),label:'Tasbih')],),); } }
