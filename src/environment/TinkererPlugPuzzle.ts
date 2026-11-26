import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { TinkererPlugData } from '../levels/LevelSchema';

const PLUG_WIDTH = 42;
const PLUG_HEIGHT = 50;
const PLUG_TIP_OFFSET = 21;
const PLUG_COLOR = 0xef4444;
const PLUG_BODY_COLOR = 0xb91c1c;
const SOCKET_COLOR = 0x1f2937;
const CONTACT_TOLERANCE = 8;
const OUTLET_SNAP_RANGE = 14;
const WIRE_POINT_COUNT = 18;
const WIRE_GRAVITY = 420;
const WIRE_DAMPING = 0.985;
const WIRE_FLOOR_CLEARANCE = 4;
const WIRE_SLACK_SAG = 12;
const WIRE_FOLLOW_STIFFNESS = 9;

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
  private wireAnchor: { x: number; y: number } | null = null;
  private plugPosition: { x: number; y: number };
  private grabbedById: string | null = null;
  private grabSide: GrabSide | null = null;
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
    this.setPlugPosition(data.plugStart.x, data.plugStart.y);
    this.wirePoints = this.createWirePoints();
    this.drawWire();
    this.updatePresentation(undefined);
  }

  public update(
    activeCharacter: PlayerCharacter,
    grabPressed: boolean,
    deltaSeconds: number,
  ): void {
    if (this.pluggedIn) {
      this.updateWire(deltaSeconds);
      return;
    }

    const wasGrabbedByActive = this.grabbedById === activeCharacter.id;
    const adjacentSide = this.findAdjacentSide(activeCharacter);
    const isTinkerer = activeCharacter.getArchetype() === 'tinkerer';
    const isGrounded = activeCharacter.getContacts().grounded;

    if (this.grabbedById === null) {
      if (grabPressed && isTinkerer && isGrounded && adjacentSide !== null) {
        this.grabbedById = activeCharacter.id;
        this.grabSide = adjacentSide;
        this.plugOrientation = adjacentSide;
        if (this.wireAnchor === null) {
          this.wireAnchor = this.getWireRoot();
          this.wireAnchorMarker
            .setPosition(this.wireAnchor.x, this.wireAnchor.y)
            .setVisible(true);
          this.resetWirePoints();
        }
      }
    } else if (
      this.grabbedById !== activeCharacter.id ||
      !isTinkerer ||
      !isGrounded
    ) {
      this.release();
    }

    const activeGrabSide = this.grabSide;
    if (this.grabbedById === activeCharacter.id && activeGrabSide !== null) {
      this.positionBeside(activeCharacter, activeGrabSide);

      if (wasGrabbedByActive && grabPressed) {
        if (
          this.isAlignedWithOutlet(
            this.plugPosition.x,
            this.plugPosition.y,
            activeGrabSide,
          )
        ) {
          this.plugIn(activeGrabSide);
        } else {
          this.release();
        }
      }
    }

    this.updateWire(deltaSeconds);
    this.updatePresentation(activeCharacter);
  }

  public reset(): void {
    this.pluggedIn = false;
    this.grabbedById = null;
    this.grabSide = null;
    this.plugOrientation = 1;
    this.wireAnchor = null;
    this.wireAnchorMarker.setVisible(false);
    this.plugVisual.setScale(1, 1);
    this.outletLabel.setText('OUTLET').setColor('#fecaca');
    this.outletTopSocket.setVisible(true);
    this.outletBottomSocket.setVisible(true);
    this.setPlugPosition(this.data.plugStart.x, this.data.plugStart.y);
    this.resetWirePoints();
    this.drawWire();
    this.updatePresentation(undefined);
  }

  private positionBeside(character: PlayerCharacter, side: GrabSide): void {
    const characterBounds = character.physicsObject.getBounds();
    const plugX =
      characterBounds.centerX +
      side * (characterBounds.width / 2 + PLUG_WIDTH / 2 - 2);
    const plugY =
      characterBounds.centerY + (characterBounds.height - PLUG_HEIGHT) / 2;
    this.setPlugPosition(plugX, plugY);
    this.plugVisual.setScale(side, 1);
  }

  private findAdjacentSide(character: PlayerCharacter): GrabSide | null {
    const characterBounds = character.physicsObject.getBounds();
    const plugLeft = this.plugPosition.x - PLUG_WIDTH / 2;
    const plugRight = this.plugPosition.x + PLUG_WIDTH / 2;
    const plugTop = this.plugPosition.y - PLUG_HEIGHT / 2;
    const plugBottom = this.plugPosition.y + PLUG_HEIGHT / 2;
    const overlapsVertically =
      characterBounds.bottom > plugTop && characterBounds.top < plugBottom;
    if (!overlapsVertically) {
      return null;
    }

    const gapOnLeft = plugLeft - characterBounds.right;
    if (
      gapOnLeft >= -CONTACT_TOLERANCE &&
      gapOnLeft <= this.data.interactionRange
    ) {
      return 1;
    }

    const gapOnRight = characterBounds.left - plugRight;
    if (
      gapOnRight >= -CONTACT_TOLERANCE &&
      gapOnRight <= this.data.interactionRange
    ) {
      return -1;
    }

    return null;
  }

  private isAlignedWithOutlet(
    plugX: number,
    plugY: number,
    side: GrabSide,
  ): boolean {
    return (
      Math.abs(plugX + side * PLUG_TIP_OFFSET - this.data.outlet.x) <=
        OUTLET_SNAP_RANGE &&
      Math.abs(plugY - this.data.outlet.y) <= PLUG_HEIGHT / 2
    );
  }

  private plugIn(side: GrabSide): void {
    this.pluggedIn = true;
    this.grabbedById = null;
    this.grabSide = null;
    this.plugOrientation = side;
    this.setPlugPosition(
      this.data.outlet.x - side * PLUG_TIP_OFFSET,
      this.data.outlet.y,
    );
    this.plugVisual.setScale(side, 1);
    this.outletLabel.setText('OUTLET · POWERED').setColor('#bbf7d0');
    this.outletTopSocket.setVisible(false);
    this.outletBottomSocket.setVisible(false);
  }

  private setPlugPosition(x: number, y: number): void {
    this.plugPosition = { x, y };
    this.plugVisual.setPosition(x, y);
    this.statusText.setPosition(x, y - PLUG_HEIGHT / 2 - 10);
  }

  private updatePresentation(
    activeCharacter: PlayerCharacter | undefined,
  ): void {
    if (this.pluggedIn) {
      this.statusText.setText('PLUGGED IN').setColor('#bbf7d0');
      return;
    }

    if (this.grabbedById !== null) {
      this.statusText.setText('PRESS C TO PLACE').setColor('#fee2e2');
      return;
    }

    if (activeCharacter === undefined) {
      this.statusText.setText('PRESS C TO GRAB').setColor('#fee2e2');
      return;
    }

    const isNearby = this.findAdjacentSide(activeCharacter) !== null;
    if (!isNearby) {
      this.statusText.setText('MATCH RED PLUG TO OUTLET').setColor('#fee2e2');
    } else if (activeCharacter.getArchetype() === 'tinkerer') {
      this.statusText.setText('PRESS C TO GRAB').setColor('#fee2e2');
    } else {
      this.statusText.setText('TINKERER ONLY').setColor('#fde68a');
    }
  }

  private release(): void {
    this.grabbedById = null;
    this.grabSide = null;
  }

  private getWireRoot(): { x: number; y: number } {
    return {
      x: this.plugPosition.x - this.plugOrientation * PLUG_TIP_OFFSET,
      y: this.plugPosition.y,
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
    const root = this.getWireRoot();
    const anchor = this.wireAnchor ?? {
      x: root.x - this.plugOrientation * 20,
      y: root.y,
    };
    this.wirePoints.forEach((point, index) => {
      const t = index / (this.wirePoints.length - 1);
      point.x = anchor.x + (root.x - anchor.x) * t;
      point.y =
        anchor.y +
        (root.y - anchor.y) * t +
        Math.sin(Math.PI * t) * WIRE_SLACK_SAG;
      point.previousX = point.x;
      point.previousY = point.y;
    });
  }

  private updateWire(deltaSeconds: number): void {
    const root = this.getWireRoot();
    const anchor = this.wireAnchor ?? {
      x: root.x - this.plugOrientation * 20,
      y: root.y,
    };
    const delta = Math.min(deltaSeconds, 1 / 30);
    const gravityStep = WIRE_GRAVITY * delta * delta;
    const floorLimit = this.floorY - WIRE_FLOOR_CLEARANCE;

    for (let index = 0; index < this.wirePoints.length; index += 1) {
      const point = this.wirePoints[index]!;
      const t = index / (this.wirePoints.length - 1);
      const targetX = anchor.x + (root.x - anchor.x) * t;
      const targetY =
        anchor.y +
        (root.y - anchor.y) * t +
        Math.sin(Math.PI * t) * WIRE_SLACK_SAG;
      if (index === 0 || index === this.wirePoints.length - 1) {
        point.x = targetX;
        point.y = targetY;
        point.previousX = targetX;
        point.previousY = targetY;
        continue;
      }
      const velocityX = (point.x - point.previousX) * WIRE_DAMPING;
      const velocityY = (point.y - point.previousY) * WIRE_DAMPING;
      point.previousX = point.x;
      point.previousY = point.y;
      point.x += velocityX;
      point.y = Math.min(point.y + velocityY + gravityStep, floorLimit);
      if (point.y === floorLimit) {
        point.previousY = point.y;
      }
      const follow = Math.min(WIRE_FOLLOW_STIFFNESS * delta, 1);
      point.x += (targetX - point.x) * follow;
      point.y += (targetY - point.y) * follow;
    }

    this.drawWire();
  }

  private drawWire(): void {
    this.wireGraphics.clear();
    this.wireGraphics.lineStyle(7, 0x1f2937, 1);
    this.drawWirePath();
    this.wireGraphics.lineStyle(3, 0xf87171, 1);
    this.drawWirePath();
    const tail = this.wirePoints[this.wirePoints.length - 1]!;
    this.wireGraphics.fillStyle(0xe5e7eb, 1).fillCircle(tail.x, tail.y, 4);
  }

  private drawWirePath(): void {
    this.wireGraphics.beginPath();
    this.wireGraphics.moveTo(this.wirePoints[0]!.x, this.wirePoints[0]!.y);
    for (let index = 1; index < this.wirePoints.length; index += 1) {
      this.wireGraphics.lineTo(
        this.wirePoints[index]!.x,
        this.wirePoints[index]!.y,
      );
    }
    this.wireGraphics.strokePath();
  }
}
