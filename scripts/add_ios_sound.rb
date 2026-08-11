require 'xcodeproj'
require 'fileutils'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'App' } || project.targets.first

src  = 'www/audio/notification.wav'
dest = 'ios/App/App/notification.wav'

unless File.exist?(src)
  puts "❌ Не знайдено #{src} — перевірте, що файл є в репозиторії"
  exit 1
end

FileUtils.cp(src, dest)

group = project.main_group.find_subpath('App', true)
already_added = group.files.any? { |f| f.path == 'notification.wav' }

unless already_added
  file_ref = group.new_reference('notification.wav')
  target.add_resources([file_ref])
  puts "✅ notification.wav додано до Copy Bundle Resources"
else
  puts "ℹ️ notification.wav вже зареєстровано в проєкті"
end

project.save
