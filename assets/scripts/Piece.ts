import {
    _decorator,
    Component,
    Vec3,
    MeshRenderer,
    Color,
    Material,
    Enum,
    Node,
    Sprite,
    SpriteFrame,
    Texture2D,
    UITransform,
    Size,
    resources,
    error,
    Graphics,
    Layers
} from 'cc';

const { ccclass, property } = _decorator;

export enum LoaiQuan {
    TUONG_SOAI,
    SI,
    TUONG_VOI,
    XE,
    MA,
    PHAO,
    TOT
}

Enum(LoaiQuan);

const TEN_ANH_THEO_LOAI_QUAN: Record<LoaiQuan, string> = {
    [LoaiQuan.TUONG_SOAI]: 'tuong',
    [LoaiQuan.SI]: 'si',
    [LoaiQuan.TUONG_VOI]: 'voi',
    [LoaiQuan.XE]: 'xe',
    [LoaiQuan.MA]: 'ma',
    [LoaiQuan.PHAO]: 'phao',
    [LoaiQuan.TOT]: 'tot'
};

@ccclass('Piece')
export class QuanCo extends Component {

    public hang = 0;
    public cot = 0;

    @property({ type: Enum(LoaiQuan) })
    public loaiQuan: LoaiQuan = LoaiQuan.XE;

    @property
    public laQuanDo = true;

    private hienThiMesh: MeshRenderer | null = null;
    private vatLieu: Material | null = null;
    private readonly mauDangChon = new Color(255, 220, 0, 255);
    private readonly mauQuanDo = new Color(210, 35, 35, 255);
    private readonly mauQuanDen = new Color(35, 35, 35, 255);
    private spriteQuanCo: Sprite | null = null;
    private maTaiAnh = 0;

    onLoad() {
        this.luuVatLieu();
        this.taoSpriteQuanCo();
        this.anMeshRenderer();
        this.boChon();
    }

    public khoiTao(hang: number, cot: number, loaiQuan: LoaiQuan = this.loaiQuan, laQuanDo: boolean = this.laQuanDo) {
        this.hang = hang;
        this.cot = cot;
        this.loaiQuan = loaiQuan;
        this.laQuanDo = laQuanDo;
        this.boChon();

        if (this.spriteQuanCo) {
            this.loadAnhQuanCo();
        }
    }

    public chon() {
        this.doiMauQuan(this.mauDangChon);
    }

    public boChon() {
        this.doiMauQuan(this.laQuanDo ? this.mauQuanDo : this.mauQuanDen);
    }

    public diChuyenDen(hang: number, cot: number, viTriTheGioi: Vec3) {
        this.hang = hang;
        this.cot = cot;
        this.node.setWorldPosition(viTriTheGioi);
    }

    private luuVatLieu() {
        this.hienThiMesh = this.getComponent(MeshRenderer);

        if (this.hienThiMesh) {
            this.vatLieu = this.hienThiMesh.getMaterialInstance(0);
        }
    }

    private anMeshRenderer() {
        if (this.hienThiMesh) {
            this.hienThiMesh.enabled = false;
        }
    }

    private doiMauQuan(mau: Color) {
        if (!this.vatLieu) {
            this.luuVatLieu();
        }

        if (this.vatLieu) {
            this.vatLieu.setProperty('mainColor', mau);
        }
    }

    private taoSpriteQuanCo() {
        const nodeSprite = new Node('SpriteQuanCo');
        nodeSprite.layer = this.node.layer || Layers.Enum.UI_2D;
        nodeSprite.setPosition(new Vec3(0, 0, 0));
        nodeSprite.setScale(new Vec3(1, 1, 1));
        this.node.addChild(nodeSprite);

        this.spriteQuanCo = nodeSprite.addComponent(Sprite);
        this.spriteQuanCo.sizeMode = Sprite.SizeMode.CUSTOM;
        const uiTransform = nodeSprite.getComponent(UITransform) || nodeSprite.addComponent(UITransform);
        const kichThuocNode = this.node.getComponent(UITransform)?.contentSize;
        uiTransform.setContentSize(kichThuocNode ?? new Size(48, 48));
    }

    private loadAnhQuanCo() {
        const duongDan = this.layDuongDanAnh();
        const maTaiAnhHienTai = ++this.maTaiAnh;

        resources.load(duongDan, Texture2D, (err, texture) => {
            if (maTaiAnhHienTai !== this.maTaiAnh) {
                return;
            }

            if (err) {
                error(`Không thể load ảnh quân cờ: ${duongDan}`, err);
                return;
            }

            if (this.spriteQuanCo && texture) {
                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                this.spriteQuanCo.spriteFrame = spriteFrame;

                const nodeChu = this.node.getChildByName('TenQuan');
                if (nodeChu) {
                    nodeChu.active = false;
                }

                const graphics = this.getComponent(Graphics);
                if (graphics) {
                    graphics.enabled = false;
                }
            }
        });
    }

    private layDuongDanAnh(): string {
        const mau = this.laQuanDo ? 'do' : 'den';
        const tenQuan = TEN_ANH_THEO_LOAI_QUAN[this.loaiQuan] ?? 'xe';

        return `pieces/${tenQuan}-${mau}/texture`;
    }
}
