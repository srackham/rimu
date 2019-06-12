export class Reader {
  lines: string[]
  pos: number       // Line index of current line.

  constructor(text: string) {
    text = text.replace('\u0000', ' ') // Used internally by spans package.
    text = text.replace('\u0001', ' ') // Used internally by spans package.
    text = text.replace('\u0002', ' ') // Used internally by macros package.
    // Split lines on newline boundaries.
    // http://stackoverflow.com/questions/1155678/javascript-string-newline-character
    // Split is broken on IE8 e.g. 'X\n\nX'.split(/\n/g).length) returns 2 but should return 3.
    this.lines = text.split(/\r\n|\r|\n/g)
    this.pos = 0
  }

  get cursor(): string {
    console.assert(!this.eof())
    return this.lines[this.pos]
  }

  set cursor(value: string) {
    console.assert(!this.eof())
    this.lines[this.pos] = value
  }

  // Return true if the cursor has advanced over all input lines.
  eof(): boolean {
    return this.pos >= this.lines.length
  }

  // Move cursor to next input line.
  next(): void {
    if (!this.eof()) this.pos++
  }

  // Read to the first line matching the re.
  // Return the array of lines preceding the match plus a line containing
  // the $1 match group (if it exists).
  // Return null if an EOF is encountered.
  // Exit with the reader pointing to the line following the match.
  readTo(find: RegExp): string[] | null {
    let result: string[] = []
    let match: string[] | null = null
    while (!this.eof()) {
      match = this.cursor.match(find)
      if (match) {
        if (match[1] !== undefined) {
          result.push(match[1])   // $1
        }
        this.next()
        break
      }
      result.push(this.cursor)
      this.next()
    }
    // Blank line matches EOF.
    if (match || (find.toString() === '/^$/' && this.eof())) {
      return result
    }
    else {
      return null
    }
  }

  skipBlankLines(): void {
    while (!this.eof() && this.cursor.trim() === '') {
      this.next()
    }
  }

}

export class Writer {
  buffer: string[]  // Appending an array is faster than string concatenation.

  constructor() {
    this.buffer = []
  }

  write(s: string): void {
    this.buffer.push(s)
  }

  toString(): string {
    return this.buffer.join('')
  }

}
