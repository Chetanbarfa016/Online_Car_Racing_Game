import os
import zipfile

def make_zip(source_dir, output_filename):
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
    print(f"Created {output_filename} successfully!")

if __name__ == "__main__":
    public_dir = r"C:\Users\Chetan\Downloads\Online_Car_Racing_Game\public"
    zip_out = r"C:\Users\Chetan\Downloads\Online_Car_Racing_Game\game_playgama.zip"
    make_zip(public_dir, zip_out)
