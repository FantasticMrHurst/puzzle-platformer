import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { TinkererPlugData } from '../levels/LevelSchema';
import type { Position } from '../rendering/interpolatePosition';

const PLUG_WIDTH = 42;
const PLUG_HEIGHT = 50;
const PLUG_TIP_OFFSET = 21;
const PLUG_COLOR = 0xef4444;
const PLUG_BODY_COLOR = 0xb91c1c;
const SOCKET_COLOR = 0x1f2937;
const HANDLE_OFFSET = 18;
const DROP_GRAVITY = 1400;
const OUTLET_SNAP_RANGE = 14;
const WIRE_POINT_COUNT = 32;
const WIRE_GRAVITY = 760;
const WIRE_DAMPING = 0.975;
const WIRE_FLOOR_CLEARANCE = 4;
const WIRE_CONSTRAINT_PASSES = 10;
const WIRE_GROUND_DRAG = 0.7;

type GrabSide = -1 | 1;

interface WirePoint {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
}

export class TinkererPlugPuzzle {
  private readonly plugVisual: Phaser.GameObjects.Container;
  private readonly outletTopSocket: Phaser.GameObjects.Ellipse;
  private readonly outletBottomSocket: Phaser.GameObjects.Ellipse;
  private readonly outletLabel: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly wireGraphics: Phaser.GameObjects.Graphics;
  private readonly wireAnchorMarker: Phaser.GameObjects.Arc;
  private readonly wirePoints: WirePoint[];
  private wireAnchor: Position | null = null;
  private plugPosition: Position;
  private holder: PlayerCharacter | null = null;
  private dropSpeed = 0;
  private plugOrientation: GrabSide = 1;
  private pluggedIn = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: TinkererPlugData,
    private readonly floorY: number,
  ) {
    this.plugPosition = { ...data.plugStart };
    scene.add
      .rectangle(data.outlet.x + 14, data.outlet.y, 64, 84, PLUG_COLOR)
      .setStrokeStyle(4, 0xfca5a5)
      .setDepth(3);
    this.outletTopSocket = scene.add
      .ellipse(data.outlet.x, data.outlet.y - 9, 8, 16, SOCKET_COLOR)
      .setDepth(4);
    this.outletBottomSocket = scene.add
      .ellipse(data.outlet.x, data.outlet.y + 9, 8, 16, SOCKET_COLOR)
      .setDepth(4);
    this.outletLabel = scene.add
      .text(data.outlet.x + 14, data.outlet.y - 48, 'OUTLET', {
        color: '#fecaca',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.plugVisual = scene.add.container(data.plugStart.x, data.plugStart.y);
    this.plugVisual.add([
      scene.add.rectangle(-18, 0, 15, 18, 0x374151).setStrokeStyle(2, 0x111827),
      scene.add
        .rectangle(-6, 0, 30, PLUG_HEIGHT, PLUG_COLOR)
        .setStrokeStyle(3, 0xfca5a5),
      scene.add.rectangle(15, -9, 12, 6, 0xe5e7eb),
      scene.add.rectangle(15, 9, 12, 6, 0xe5e7eb),
      scene.add.rectangle(-6, 0, 12, 16, PLUG_BODY_COLOR),
    ]);
    this.plugVisual.setDepth(5);
    this.statusText = scene.add
      .text(data.plugStart.x, data.plugStart.y - PLUG_HEIGHT / 2 - 10, '', {
        backgroundColor: '#080b16cc',
        color: '#fee2e2',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.wireGraphics = scene.add.graphics().setDepth(4);
    this.wireAnchorMarker = scene.add
      .circle(data.plugStart.x, data.plugStart.y, 7, 0x1f2937)
      .setStrokeStyle(2, 0xf87171)
      .setDepth(4)
      .setVisible(false);
    this.wirePoints = this.createWirePoints();
    this.resetWirePoints();
    this.render();
    this.updatePresentation(undefined);
  }

  public update(
    activeCharacter: PlayerCharacter,
    grabPressed: boolean,
    deltaSeconds: number,
  ): boolean {
    if (this.pluggedIn) {
      this.updateWire(deltaSeconds);
      return false;
    }

    let consumed = false;
    if (this.holder !== null) {
      this.plugOrientation = this.holder.getFacingDirection();
      this.holder.setPlugCarry(this.plugOrientation);
      this.plugPosition = this.carriedPosition(this.holder, false);
      if (grabPressed && this.holder === activeCharacter) {
        consumed = true;
        if (this.isAlignedWithOutlet()) this.plugIn();
        else this.release();
      }
    } else {
      this.updateDrop(deltaSeconds);
      if (
        grabPressed &&
        activeCharacter.getArchetype() === 'tinkerer' &&
        activeCharacter.getPlugGrip() === undefined
      ) {
        const side = this.findGrabSide(activeCharacter);
        if (side !== null) {
          this.grab(activeCharacter, side);
          consumed = true;
        }
      }
    }

    this.updateWire(deltaSeconds);
    this.updatePresentation(activeCharacter);
    return consumed;
  }

  public render(): void {
    const position =
      this.holder === null
        ? this.plugPosition
        : this.carriedPosition(this.holder, true);
    this.plugVisual
      .setPosition(position.x, position.y)
      .setScale(this.plugOrientation, 1)
      .setDepth(
        this.holder === null ? 5 : this.holder.visualObject.depth - 0.25,
      );
    this.statusText.setPosition(position.x, position.y - PLUG_HEIGHT / 2 - 10);
    this.drawWire(this.getWireRoot(position));
  }

  public reset(): void {
    this.pluggedIn = false;
    this.release();
    this.plugOrientation = 1;
    this.wireAnchor = null;
    this.wireAnchorMarker.setVisible(false);
    this.outletLabel.setText('OUTLET').setColor('#fecaca');
    this.outletTopSocket.setVisible(true);
    this.outletBottomSocket.setVisible(true);
    this.plugPosition = { ...this.data.plugStart };
    this.resetWirePoints();
    this.render();
    this.updatePresentation(undefined);
  }

  private grab(character: PlayerCharacter, side: GrabSide): void {
    if (this.wireAnchor === null) {
      this.wireAnchor = this.getWireRoot(this.plugPosition);
      this.wireAnchorMarker
        .setPosition(this.wireAnchor.x, this.wireAnchor.y)
        .setVisible(true);
      this.resetWirePoints();
    }
    this.holder = character;
    this.plugOrientation = side;
    character.setPlugCarry(side);
    this.plugPosition = this.carriedPosition(character, false);
  }

  private carriedPosition(
    character: PlayerCharacter,
    interpolated: boolean,
  ): Position {
    const grip = character.getPlugGrip(interpolated);
    if (grip === undefined) return this.plugPosition;
    return { x: grip.x + this.plugOrientation * HANDLE_OFFSET, y: grip.y };
  }

  private updateDrop(deltaSeconds: number): void {
    const floor = this.floorY - PLUG_HEIGHT / 2;
    if (this.plugPosition.y >= floor) return;
    this.dropSpeed += DROP_GRAVITY * deltaSeconds;
    this.plugPosition = {
      x: this.plugPosition.x,
      y: Math.min(floor, this.plugPosition.y + this.dropSpeed * deltaSeconds),
    };
  }

  private findGrabSide(character: PlayerCharacter): GrabSide | null {
    const characterBounds = character.physicsObject.getBounds();
    const dx = this.plugPosition.x - characterBounds.centerX;
    const dy = this.plugPosition.y - characterBounds.centerY;
    const range = this.data.interactionRange;
    if (
      Math.abs(dx) > (characterBounds.width + PLUG_WIDTH) / 2 + range ||
      Math.abs(dy) > (characterBounds.height + PLUG_HEIGHT) / 2 + range
    )
      return null;
    return dx === 0 ? character.getFacingDirection() : dx > 0 ? 1 : -1;
  }

  private isAlignedWithOutlet(): boolean {
    return (
      Math.abs(
        this.plugPosition.x +
          this.plugOrientation * PLUG_TIP_OFFSET -
          this.data.outlet.x,
      ) <= OUTLET_SNAP_RANGE &&
      Math.abs(this.plugPosition.y - this.data.outlet.y) <= PLUG_HEIGHT / 2
    );
  }

  private plugIn(): void {
    this.pluggedIn = true;
    this.release();
    this.plugPosition = {
      x: this.data.outlet.x - this.plugOrientation * PLUG_TIP_OFFSET,
      y: this.data.outlet.y,
    };
    this.outletLabel.setText('OUTLET · POWERED').setColor('#bbf7d0');
    this.outletTopSocket.setVisible(false);
    this.outletBottomSocket.setVisible(false);
  }

  private updatePresentation(
    activeCharacter: PlayerCharacter | undefined,
  ): void {
    if (this.pluggedIn) {
      this.statusText.setText('PLUGGED IN').setColor('#bbf7d0');
      return;
    }

    if (this.holder !== null) {
      this.statusText
        .setText(
          this.holder === activeCharacter
            ? this.isAlignedWithOutlet()
              ? 'PRESS C TO CONNECT'
              : 'PRESS C TO DROP'
            : 'TINKERER HOLDING PLUG',
        )
        .setColor('#fee2e2');
      return;
    }

    if (activeCharacter === undefined) {
      this.statusText.setText('PRESS C TO GRAB').setColor('#fee2e2');
      return;
    }

    const isNearby = this.findGrabSide(activeCharacter) !== null;
    if (!isNearby) {
      this.statusText.setText('MATCH RED PLUG TO OUTLET').setColor('#fee2e2');
    } else if (activeCharacter.getArchetype() === 'tinkerer') {
      this.statusText.setText('PRESS C TO GRAB').setColor('#fee2e2');
    } else {
      this.statusText.setText('TINKERER ONLY').setColor('#fde68a');
    }
  }

  private release(): void {
    this.holder?.setPlugCarry(null);
    this.holder = null;
    this.dropSpeed = 0;
  }

  private getWireRoot(position: Position): Position {
    return {
      x: position.x - this.plugOrientation * PLUG_TIP_OFFSET,
      y: position.y,
    };
  }

  private createWirePoints(): WirePoint[] {
    return Array.from({ length: WIRE_POINT_COUNT }, () => ({
      x: 0,
      y: 0,
      previousX: 0,
      previousY: 0,
    }));
  }

  private resetWirePoints(): void {
    const root = this.getWireRoot(this.plugPosition);
    const anchor = this.getWireAnchor(root);
    this.wirePoints.forEach((point, index) => {
      const t = index / (this.wirePoints.length - 1);
      point.x = anchor.x + (root.x - anchor.x) * t;
      point.y = anchor.y + (root.y - anchor.y) * t;
      point.previousX = point.x;
      point.previousY = point.y;
    });
  }

  private updateWire(deltaSeconds: number): void {
    if (this.wireAnchor === null) return;
    const root = this.getWireRoot(this.plugPosition);
    const anchor = this.wireAnchor;
    const gravityStep = WIRE_GRAVITY * deltaSeconds * deltaSeconds;
    const last = this.wirePoints.length - 1;
    const floorLimit = this.floorY - WIRE_FLOOR_CLEARANCE;
    const distance = Math.hypot(root.x - anchor.x, root.y - anchor.y);
    const slack = Math.min(60, 16 + distance * 0.08);
    const linkLength = (distance + slack) / last;

    Object.assign(this.wirePoints[0]!, anchor);
    Object.assign(this.wirePoints[last]!, root);
    for (let index = 1; index < last; index += 1) {
      const point = this.wirePoints[index]!;
      const drag = point.y >= floorLimit ? WIRE_GROUND_DRAG : 1;
      const velocityX = (point.x - point.previousX) * WIRE_DAMPING;
      const velocityY = (point.y - point.previousY) * WIRE_DAMPING;
      point.previousX = point.x;
      point.previousY = point.y;
      point.x += velocityX * drag;
      point.y = Math.min(point.y + velocityY + gravityStep, floorLimit);
    }

    // Neighboring points pull on each other as the grounded end pays out slack.
    // Alternating sweeps propagate tension from both pinned ends.
    for (let pass = 0; pass < WIRE_CONSTRAINT_PASSES; pass += 1) {
      for (let link = 0; link < last; link += 1) {
        const index = pass % 2 === 0 ? link : last - 1 - link;
        const start = this.wirePoints[index]!;
        const end = this.wirePoints[index + 1]!;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        if (length <= linkLength) continue;
        const startWeight = index === 0 ? 0 : index === last - 1 ? 1 : 0.5;
        const correction = (length - linkLength) / length;
        start.x += dx * correction * startWeight;
        start.y = Math.min(floorLimit, start.y + dy * correction * startWeight);
        end.x -= dx * correction * (1 - startWeight);
        end.y = Math.min(
          floorLimit,
          end.y - dy * correction * (1 - startWeight),
        );
      }
    }
  }

  private getWireAnchor(root: Position): Position {
    return (
      this.wireAnchor ?? {
        x: root.x - this.plugOrientation * 20,
        y: root.y,
      }
    );
  }

  private drawWire(root: Position): void {
    this.wireGraphics.clear();
    this.wireGraphics.lineStyle(7, 0x1f2937, 1);
    this.drawWirePath(root);
    this.wireGraphics.lineStyle(3, 0xf87171, 1);
    this.drawWirePath(root);
    this.wireGraphics.fillStyle(0xe5e7eb, 1).fillCircle(root.x, root.y, 4);
  }

  private drawWirePath(root: Position): void {
    const anchor = this.getWireAnchor(root);
    this.wireGraphics.beginPath();
    this.wireGraphics.moveTo(anchor.x, anchor.y);
    if (this.wireAnchor !== null) {
      for (let index = 1; index < this.wirePoints.length - 1; index += 1) {
        const point = this.wirePoints[index]!;
        this.wireGraphics.lineTo(point.x, point.y);
      }
    }
    this.wireGraphics.lineTo(root.x, root.y);
    this.wireGraphics.strokePath();
  }
}
