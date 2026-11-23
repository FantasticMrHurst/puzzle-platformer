export interface RosterMember {
  readonly id: string;
}

export class CharacterRoster<T extends RosterMember> {
  private readonly members: readonly T[];
  private activeIndex = 0;

  public constructor(members: readonly T[]) {
    if (members.length < 1 || members.length > 3) {
      throw new RangeError(
        'A character roster must contain between 1 and 3 members',
      );
    }
    if (new Set(members.map((member) => member.id)).size !== members.length) {
      throw new Error('Character roster member IDs must be unique');
    }

    this.members = [...members];
  }

  public getMembers(): readonly T[] {
    return this.members;
  }

  public getActive(): T {
    return this.members[this.activeIndex]!;
  }

  public getActiveIndex(): number {
    return this.activeIndex;
  }

  public selectSlot(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.members.length) {
      return false;
    }
    if (index === this.activeIndex) {
      return false;
    }

    this.activeIndex = index;
    return true;
  }

  public cycle(direction: -1 | 1): boolean {
    if (this.members.length === 1) {
      return false;
    }

    this.activeIndex =
      (this.activeIndex + direction + this.members.length) %
      this.members.length;
    return true;
  }
}
