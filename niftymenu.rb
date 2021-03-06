#!/usr/bin/env ruby
require 'shellwords'

DEFAULT_APP = "Marked 2"

$appname = DEFAULT_APP
if ARGV[0] && ARGV[0].length > 1
  $appname = ARGV.join(' ')
end

def replace_with_entity(char)
  case char.downcase
  when /apple/
    "&#63743;"
  when /(comm(and)?|cmd|clover)/
    "&#8984;"
  when /(cont(rol)?|ctl|ctrl)/
    "&#8963;"
  when /(opt(ion)?|alt)/
    "&#8997;"
  when /shift/
    "&#8679;"
  when /tab/
    "&#8677;"
  when /caps(lock)?/
    "&#8682;"
  when /eject/
    "&#9167;"
  when /return/
    "&#9166;"
  when /enter/
    "&#8996;"
  when /(del(ete)?|back(space)?)/
    "&#9003;"
  when /fwddel(ete)?/
    "&#8998;"
  when /(esc(ape)?)/
    "&#9099;"
  when /right/
    "&#8594;"
  when /left/
    "&#8592;"
  when /up/
    "&#8593;"
  when /down/
    "&#8595;"
  when /pgup/
    "&#8670;"
  when /pgdn/
    "&#8671;"
  when /home/
    "&#8598;"
  when /end/
    "&#8600;"
  when /clear/
    "&#8999;"
  when /gear/
    "&#9881;"
  else
    char
  end
end

def render_mods(string)
  # Replace {{insertions}}
  string.gsub(/\{(.*?)\}/) {|mtch|
    m = Regexp.last_match
    replace_with_entity(m[1].strip)
  }
end

def bitwise_to_html(int)
  mod_string = case int
  when 0
    "{cmd}"
  when 1
    "{shift}{cmd}"
  when 2
    "{opt}{cmd}"
  when 3
    "{opt}{shift}{cmd}"
  when 4
    "{ctrl}{cmd}"
  when 5
    "{ctrl}{shift}{cmd}"
  when 6
    "{ctrl}{opt}{cmd}"
  when 12
    "{ctrl}"
  when 13
    "{ctrl}{shift}"
  when 15
    "{ctrl}{opt}{shift}"
  else
    int.to_s
  end
  render_mods(mod_string)
end

def get_menus
  scpt = DATA.read.force_encoding('utf-8')

  scpt.gsub!(/_APPNAME_/,$appname)

  res = %x{osascript <<'APPLESCRIPT'
  #{scpt}
  APPLESCRIPT}.strip.force_encoding('utf-8')
  res
end

def menus_to_markdown(input)
  # Replace entire Apple menu with just Apple logo
  input.sub!(/^menu bar 1 of application process.*?\tmenu bar item "Apple".*?(?=\tmenu bar item)/mi, "- &#63743;\n" )
  # input.sub!(/(?mi)menu bar 1 of application process "[\s\S]*?"[\s\S]*(?=\tmenu bar item)/,"- &#63743;\n")

  # replace Help Search Item
  input.gsub!( /(?mi)(?<=menu "Help"\n)(\s+)[\s\S]*?(\s+)(?=menu item)/, '\1- <span class="helpsearch"><label>Search <input type="text"></label></span>\2' )
  # reduce indent
  input.gsub!(/^\t\t/,'')

  # fix unlocalized menu items
  input.gsub!(/<<(.*?) - unlocalized>>/,'\1')

  # replace escaped quotes temporarily
  input.gsub!(/\\"/,"''")
  # replace divider items
  input.gsub!(/menu item \d+/,'- <span class="divider"></span>')
  # remove any doubled dividers
  input.gsub!(/(^(\t*)- <span class="divider"><\/span>\n)+/,"\\2- <span class=\"divider\"></span>\n")
  # Extract keyboard shortcuts
  input.gsub!(/>>(?<mod>\d+)\|(?<key>\S)<< menu item "(?<name>.*?)"/) {|match|
    m = Regexp.last_match
    key_string = bitwise_to_html(m['mod'].to_i) + m['key']

    %Q{menu item "<span class='menuitem'>#{m['name']}</span> <span class='shortcut'>#{key_string.gsub('\\') { '\\\\\\' }}</span>"}
  }
  # Clean up any botched shortcuts
  input.gsub!(/<<.*?>>/,'')

  input.gsub!(/menu bar item ".*?"/,'')
  # format menu items
  input.gsub!(/menu item "(.*?)"/,'- \1')
  # format main menu items
  input.gsub!(/^menu "(.*?)"/,'- **\1**')
  # remove items too deeply nested to work with
  # input.gsub!(/^(\t{6,})-.*?\n/,'')
  # input.gsub!(/^(\t{5,})menu \".*?\n/,'')
  # remove blank lines
  input.gsub!(/^\s+$\n/,"")
  input.gsub!(/\n+/,"\n")


  # remove extra menu lines for submenus and format
  # input.gsub!(/^(\t+)menu ".*?"\n((\1\t-.*?\n)+)/mi) {|match|
  #   m = Regexp.last_match
  #   menu_block = m[2]
  #   # return outdented menu block
  #   menu_block.gsub(/^\t/,'')
  # }
  counter = 5
  while counter > 0
    input.gsub!(/^(\t{#{counter}})- ([\s\S]*?)\s+menu "\2"((?:\n\1\t\t(?:[\s\S]*?)$)+)/m) {|match|
      m = Regexp.last_match
      space = m[1]
      menu_name = m[2]
      menu_block = m[3].strip
      # outdent menu block
      menu_block.gsub!( /(?mi)^\t/, "" )
      %Q{#{space}- #{menu_name}\n#{space}\t#{menu_block}}
    }
    counter -= 1
  end
  # remove blank lines
  input.gsub!(/^\s+$\n/,"")
  input.gsub!(/\n+/,"\n")
  # reduce indent again
  # input.gsub!(/^\t/,'')

  # restore originally-escaped quotes
  input.gsub!(/''/,'"')

  # typography fixes
  input.gsub!(/…/,'...')
  input.gsub!(/[“”]/,'"')
  input.gsub!(/[‘’]/,"'")

  # remove Services menu
  input.sub!(/\t- Services.*?Services Preferences...\n/m,"\t- Services\n\t\t- Empty\n")
  # remove Recent Items menu
  input.sub!(/\t- Open Recent.*?Clear Menu\n/m,"\t- Open Recent\n\t\t- Empty\n")
  # highlight menu items with submenus
  input.gsub!( /^(\t+)(?:- (.+?)\n)(?=\1\t-)/, "\\1- **_\\2_**\n" )

  input
end

def get_stdin(message)
  if ARGV.length
    ARGV.length.times do
      ARGV.shift
    end
  end
  system 'stty cbreak'
  $stdout.syswrite message
  res = $stdin.sysread 1
  puts
  system 'stty cooked'

  return res.chomp
end


def browser
  question = "Open in Browser?\n(c)hrome, (s)afari, (f)irefox, Enter to cancel: "
  answer = get_stdin(question).strip
  unless answer.length && answer !~ /n/i
    return false
  else
    browser = case answer.downcase
    when /c/
      "Google Chrome"
    when /s/
      "Safari"
    when /f/
      "Firefox"
    end
  end

  browser
end


def yn(question,default)
  default ||= nil
  if default && default =~ /[yn]/i
    if default =~ /y/i
      options = "Y/n"
    else
      options = "y/N"
    end
  else
    options = "y/n"
  end
  question += " #{options}: "
  answer = get_stdin(question)
  answer = answer.strip =~ /^$/ ? default : answer
  return answer =~ /y/i ? true : false
end

template =<<ENDTEMPLATE
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="utf-8"/>
<link type="text/css" rel="stylesheet" href="css/niftymenu.css"/>
</head>
<body>
__CONTENT__
<div id="demotut" data-html2canvas-ignore>
  <h1>Tutorial</h1>
  <ul>
    <li>Hover to reveal menus</li>
    <li>Click to lock in place</li>
    <li>Double click to highlight</li>
    <li>Hold shift and double click to highlight hierarchy</li>
    <li>Option-click item to add arrow</li>
    <li>Option-click shortcut to highlight</li>
    <li>Use the help menu to (fuzzy) search menu items</li>
    <li>See the settings menu (lower right)</li>
  </ul>
  <!-- <span class="hidetut">Hide</span> -->
</div>
<div id="screenshotHolder" data-html2canvas-ignore></div>
<aside class="controls" data-html2canvas-ignore>
  <span id="darkModeToggle">Dark Mode (D)</span>
  <span id="exposeToggle">Expos&eacute; (E)</span>
  <span id="backgroundToggle">Background Image</span>
  <span id="chooseWallpaper">Choose Wallpaper</span>
  <span id="randomWallpaper">Random Wallpaper</span>
  <span id="resetWallpaper">Reset Wallpaper</span>
  <span id="arrowStyle">Arrow style: Arrow</span>
  <span id="screenshot">Screenshot (S)</span>
  <span id="commandshell">Terminal ($)</span>
</aside>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/fuzzysort.min.js"></script>
<script src="js/lib/mousetrap.min.js"></script>
<script src="js/lib/html2canvas.min.js"></script>
<script src="js/nifty.min.js"></script>
</body>
</html>
ENDTEMPLATE

menus = get_menus
menus = menus_to_markdown(menus)

unless menus.strip.length > 0
  $stderr.puts "Failed to get application menus. Is the app running?"
  Process.exit 1
end

output = %x{echo #{Shellwords.escape(menus)}| multimarkdown}.strip

target = $appname.gsub(/[^a-z0-9]/i,'-') + '.html'
target = File.join('dist',target)
File.open(target,'w') do |f|
  f.puts template.sub(/__CONTENT__/,output)
  $stdout.puts "HTML written to #{target}"

  if (yn('Open in default browser?', 'Y'))
    %x{open "#{target}"}
  end
end
# Everything below is the AppleScript used to get the menu items. It is
# the work of those credited in the header comments, not my own.
__END__
-- Adapted from original by squaline (alias partron22?), emendelson, and Nigel Garvey.
-- http://macscripter.net/viewtopic.php?id=37674
on main()
  try
    tell application "System Events"
      set curApp to name of first application process whose frontmost is true
    end tell
    set appName to "_APPNAME_"
    tell application "System Events"
      tell application process appName
        set frontmost to true
        set menuExists to menu bar 1 exists
        set menustuff to "(No menu!)"
        if (menuExists) then
          set menustuff to my listToText(entire contents of menu bar 1)
        else
          error number 3001
        end if
      end tell
    end tell
  on error e number n
    tell application "System Events" to set frontmost of application process curApp to true
    tell application curApp to activate
    if n = 3001 then
      tell application curApp to display alert "No menu to gather data from!"
    end if
    error number -128
  end try
  tell application curApp to activate
  return menustuff
end main

on listToText(entireContents)
  try
    || of entireContents
  on error stuff
  end try
  set astid to AppleScript's text item delimiters
  set AppleScript's text item delimiters to {"{", "}"}
  set stuff to text from text item 2 to text item -2 of stuff
  if (stuff does not contain "application process \"") then
    try
      set scpt to (run script "script
   tell app \"System Events\"
   {" & stuff & "}
   end
   end")
    on error errMsg
      set AppleScript's text item delimiters to astid
      tell application (path to frontmost application as text) to display dialog errMsg buttons {"OK"} default button 1 with icon caution
      return errMsg
    end try
    set tmpPath to (path to temporary items as text) & "Entire contents.scpt"
    store script scpt in file tmpPath replacing yes
    set stuff to (do shell script "osadecompile " & quoted form of POSIX path of tmpPath)
    set stuff to text from text item 2 to text item -2 of stuff
  end if
  set AppleScript's text item delimiters to "\"System Events\", "
  set stuff to stuff's text items
  set newStuff to {}
  repeat with _item in stuff
    if _item does not contain "of menu \"Apple\"" and _item does not contain "of menu \"Open Recent\"" then
      set AppleScript's text item delimiters to "of application process"
      set anItem to text item 1 of _item
      try
        set _char to run script "tell application \"System Events\" to get value of attribute \"AXMenuItemCmdChar\" of " & anItem & " of application process \"_APPNAME_\""
        if _char is not missing value then
          set _mod to run script "tell application \"System Events\" to get value of attribute \"AXMenuItemCmdModifiers\" of " & anItem & " of application process \"_APPNAME_\""
          set end of newStuff to ">>" & (_mod as string) & "|" & (_char as string) & "<< " & (_item as string)
        else
          set end of newStuff to (_item as string)
        end if
      on error
        set end of newStuff to (_item as string)
      end try
    end if
  end repeat
  set stuff to newStuff
  set AppleScript's text item delimiters to " of "
  set beginning of stuff to (text from text item 2 to -1 of item 1 of stuff) & "\"System Events\""
  set tabs to tab & tab & tab & tab & tab & tab & tab & tab
  set tabs to tabs & tabs
  set tabs to tabs & tabs
  repeat with i from 2 to (count stuff)
    set thisLine to item i of stuff
    set lineBits to thisLine's text items
    set elementCount to 0
    set nameContinuation to false
    repeat with j from 1 to (count lineBits)
      set thisBit to item j of lineBits
      if ((not ((nameContinuation) or (thisBit contains "\""))) or ((thisBit ends with "\"") and (thisBit does not end with "\\\"")) or (thisBit ends with "\\\\\"")) then
        set nameContinuation to false
        set elementCount to elementCount + 1
        if (elementCount is 1) then set spec to text 1 thru text item j of thisLine
      else
        set nameContinuation to true
      end if
    end repeat
    set item i of stuff to (text 1 thru (elementCount - 3) of tabs) & spec
  end repeat
  set AppleScript's text item delimiters to linefeed
  set stuff to stuff as text
  set AppleScript's text item delimiters to astid
  return stuff
end listToText

return main()
