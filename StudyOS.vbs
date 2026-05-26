' ================================================================
' StudyOS — Zaganjalnik
' Dvoklikni za zagon aplikacije. Terminal se ne odpre.
' ================================================================

Dim fso, wsh, pot, http

Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

' Mapa projekta (kjer leži ta .vbs datoteka)
pot = fso.GetParentFolderName(WScript.ScriptFullName)

' ── Preveri, ali strežnik že teče na portu 5000 ───────────────
Dim streznikTece
streznikTece = False

On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.open "GET", "http://localhost:5000/api/zdravje", False
http.setRequestHeader "Connection", "close"
http.send
If Err.Number = 0 Then
  If http.status = 200 Then streznikTece = True
End If
On Error GoTo 0
Set http = Nothing

' ── Zaženi strežnik, če še ne teče ───────────────────────────
If Not streznikTece Then
  ' Poišči node.exe — najprej v PATH, potem v pogostih lokacijah
  Dim nodeUkaz
  nodeUkaz = "node"

  Dim mozeLocacije(3)
  mozeLocacije(0) = "C:\Program Files\nodejs\node.exe"
  mozeLocacije(1) = "C:\Program Files (x86)\nodejs\node.exe"
  mozeLocacije(2) = wsh.ExpandEnvironmentStrings("%APPDATA%\nvm\current\node.exe")
  mozeLocacije(3) = wsh.ExpandEnvironmentStrings("%ProgramFiles%\nodejs\node.exe")

  Dim i
  For i = 0 To 3
    If fso.FileExists(mozeLocacije(i)) Then
      nodeUkaz = """" & mozeLocacije(i) & """"
      Exit For
    End If
  Next

  ' Zaženi v ozadju (0 = skrito okno)
  wsh.Run "cmd /c cd /d """ & pot & """ && " & nodeUkaz & " server/index.js > nul 2>&1", 0, False

  ' Počakaj, da se strežnik zažene (max 6 sekund)
  Dim cakanje
  cakanje = 0
  Dim zagnan
  zagnan = False

  Do While cakanje < 6000 And Not zagnan
    WScript.Sleep 500
    cakanje = cakanje + 500

    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.open "GET", "http://localhost:5000/api/zdravje", False
    http.setRequestHeader "Connection", "close"
    http.send
    If Err.Number = 0 Then
      If http.status = 200 Then zagnan = True
    End If
    On Error GoTo 0
    Set http = Nothing
  Loop

  If Not zagnan Then
    ' Strežnik se ni zagnal — odpri brskalnik z obvestilom
    MsgBox "StudyOS: Strežnik se ni zagnal." & vbCrLf & vbCrLf & _
           "Preveri:" & vbCrLf & _
           "  • Ali je Node.js nameščen?" & vbCrLf & _
           "  • Ali je port 5000 prost?" & vbCrLf & vbCrLf & _
           "Aplikacija bo delovala v lokalnem načinu (brez sinhronizacije).", _
           48, "StudyOS"
  End If
End If

' ── Odpri aplikacijo v brskalniku ────────────────────────────
wsh.Run "http://localhost:5000", 1, False

Set wsh = Nothing
Set fso = Nothing
