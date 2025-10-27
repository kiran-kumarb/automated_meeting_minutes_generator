import sys
import os
import speech_recognition as sr

# Optional: suppress pydub logs if needed
import warnings
warnings.filterwarnings("ignore")

def convert_mp3_to_wav(mp3_path):
    from pydub import AudioSegment
    audio = AudioSegment.from_mp3(mp3_path)
    print("Length (ms):", len(audio)) 
    out_path = mp3_path.rsplit('.', 1)[0] + '__converted.wav'
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(out_path, format="wav")
    return out_path



if __name__ == "__main__":
    filename = sys.argv[1]
    # If MP3, convert to WAV
    if filename.lower().endswith(".mp3"):
        wav_path = convert_mp3_to_wav(filename)
    else:
        wav_path = filename

    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                text = "Could not understand audio."
            except sr.RequestError as e:
                text = f"Google API error: {e}"
            print(text)
    except Exception as e:
        print(f"Transcription failed: {e}")

    # Clean up converted file
    if wav_path != filename and os.path.exists(wav_path):
        os.remove(wav_path)
