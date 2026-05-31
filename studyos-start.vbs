Set oShell = CreateObject("WScript.Shell")
appDir = "C:\Users\HPadmin\Desktop\Aplikacija faks"
oShell.Run "cmd /c cd /d """ & appDir & """ && node server\index.js", 0, False
WScript.Sleep 3000
oShell.Run "http://localhost:5000", 1, False
