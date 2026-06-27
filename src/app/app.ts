import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, inject, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  user = signal<string>('');
  isLoginPage = signal<boolean>(true);
  readonly WORD_LENGTH = 4;
  letters = signal<string[]>(Array(this.WORD_LENGTH).fill(''));
  currentIndex = 0;
  allFourLetterWords = new Set<string>();
  currentWord = signal<string>('');
  isInvalidWord = signal<boolean>(false);
  isSameWord = signal<boolean>(false);
  isCorrectWord = signal<boolean>(false);
  isWrongMod = signal<boolean>(false);
  gameOver = signal<boolean>(false);
  gameScore = signal<number>(0);
  livesLeft = signal<string[]>(Array(3).fill(''));
  dictWords: string[] = [];
  private fb = inject(FormBuilder);
  userForm = this.fb.group({
    userName: ['', Validators.required]
  })

  filterFourLetterWords(words: string[]) {
    let fourLetterWords = new Set<string>();
    words.forEach(word => word.length == 4 && /^[a-z]+$/i.test(word) && fourLetterWords.add(word));
    this.allFourLetterWords = fourLetterWords;
    let arrFromSet = Array.from(fourLetterWords);
    this.currentWord.set(arrFromSet[Math.floor(Math.random() * arrFromSet.length)].toUpperCase());
  }


  ngOnInit(): void {
    this.user.set(localStorage.getItem('userName')?.toString() ?? '');
    if (this.user() && this.user().length > 0) {
      this.isLoginPage.set(false);
    }
    this.http.get(`https://raw.githubusercontent.com/Ankur2491/assets/refs/heads/main/all_words.json`)
      .subscribe((data: any) => {
        this.dictWords = data;
        this.filterFourLetterWords(data)
      });
  }

  ngAfterViewInit(): void {
    this.tiles.get(0)?.nativeElement.focus()
  }

  wordExistsInDict(typedWord: string): boolean {
    return this.allFourLetterWords.has(typedWord);
  }

  @ViewChildren('tile')
  tiles!: QueryList<ElementRef<HTMLInputElement>>;

  onKeyDown(event: KeyboardEvent, index: number) {

    // Backspace
    if (event.key === 'Backspace') {
      event.preventDefault();

      if (this.currentIndex === 0) {
        return;
      }

      this.currentIndex--;

      this.letters.update(current => {
        const updated = [...current];
        updated[this.currentIndex] = '';
        return updated;
      });

      this.focusCurrent();

      return;
    }

    // Arrow Left
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.focusCurrent();
      }

      return;
    }

    // Arrow Right
    if (event.key === 'ArrowRight') {
      event.preventDefault();

      if (this.currentIndex < this.WORD_LENGTH) {
        this.currentIndex++;
        this.focusCurrent();
      }

      return;
    }

    // Enter
    if (event.key === 'Enter') {
      event.preventDefault();
      let typedWord = this.letters().join('');
      let curW = this.currentWord();
      if (typedWord === curW) {
        this.isInvalidWord.set(false);
        this.isCorrectWord.set(false);
        this.isWrongMod.set(false);
        this.isSameWord.set(true);
      }
      else {
        let wordExists = this.wordExistsInDict(typedWord.toLowerCase())
        if (!wordExists) {
          this.isSameWord.set(false);
          this.isCorrectWord.set(false);
          this.isWrongMod.set(false);
          this.isInvalidWord.set(true);
          if (this.livesLeft().length == 1) {
            this.gameOver.set(true);
          }
          this.livesLeft.update(live => {
            let length = live.length;
            let x = [];
            if (length > 1) {
              length--;
              x = Array(length).fill('')
            }
            return x;
          })
        }
        else if (this.isValidModification(typedWord)) {
          this.isInvalidWord.set(false);
          this.isSameWord.set(false);
          this.isWrongMod.set(false);
          this.isCorrectWord.set(true);
          this.currentWord.set(typedWord.toUpperCase());
          this.letters.set(Array(this.WORD_LENGTH).fill(''));
          this.tiles.get(0)?.nativeElement.focus()
          this.currentIndex = 0;
          this.gameScore.update(currentScore => {
            currentScore++;
            return currentScore;
          })
        }
        else {
          this.isSameWord.set(false);
          this.isCorrectWord.set(false);
          this.isInvalidWord.set(false);
          this.isWrongMod.set(true);
        }
      }

    }
  }

  isValidModification(typedWord: string) {
    let modCount = 0;
    for (let i = 0; i < 4; i++) {
      if (typedWord.charAt(i) != this.currentWord().charAt(i)) {
        modCount++;
      }
    }
    return modCount == 1;
  }
  focusCurrent() {

    queueMicrotask(() => {

      const index = Math.min(this.currentIndex, this.WORD_LENGTH - 1);

      this.tiles.get(index)?.nativeElement.focus();

    });

  }

  get userName() {
    return this.userForm.get('userName')?.value?.toString() ?? '';
  }


  // startGame() {
  //   localStorage.setItem('userName', this.userName)
  //   console.log(this.userName)
  //   this.user.set(this.userName);
  //   this.isLoginPage.set(false);
  //   this.gameScore.set(0);
  //   this.gameOver.set(false);
  //   this.isInvalidWord.set(false);
  //   this.livesLeft.set(Array(3).fill(''));
  //   this.filterFourLetterWords(this.dictWords);
  //   this.isSameWord.set(false);
  //   this.isCorrectWord.set(false);
  //   this.isWrongMod.set(false);
  //   this.letters.set(Array(this.WORD_LENGTH).fill(''))
  //   this.userForm.reset();
  //   this.currentIndex = 0;
  //   setTimeout(() => {
  //     this.tiles.get(0)?.nativeElement.focus();
  //   });
  // }

  startGame() {
    if(!localStorage.getItem('userName')) {
      localStorage.setItem('userName', this.userName)
    }
    this.user.set(localStorage.getItem('userName')??'');
    this.isLoginPage.set(false);

    this.gameOver.set(false);
    this.gameScore.set(0);

    this.isInvalidWord.set(false);
    this.isSameWord.set(false);
    this.isCorrectWord.set(false);
    this.isWrongMod.set(false);

    this.livesLeft.set(Array(3).fill(''));
    this.letters.set(Array(this.WORD_LENGTH).fill(''));

    this.currentIndex = 0;

    this.filterFourLetterWords(this.dictWords);
    this.userForm.reset();
    setTimeout(() => {
      this.tiles.get(0)?.nativeElement.focus();
    });
  }
  logout() {
    localStorage.removeItem('userName');
    this.user.set('');
    this.isLoginPage.set(true);
  }

  onInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement;

  const value = input.value.toUpperCase().slice(0, 1);

  this.letters.update(arr => {
    const copy = [...arr];
    copy[index] = value;
    return copy;
  });

  this.currentIndex = Math.min(index + 1, this.WORD_LENGTH);

  if (value && index < this.WORD_LENGTH - 1) {
    queueMicrotask(() => {
      this.tiles.get(index + 1)?.nativeElement.focus();
    });
  }
}
}
