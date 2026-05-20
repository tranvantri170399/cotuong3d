import { _decorator, Component, MeshRenderer, Color, Material } from 'cc';

const { ccclass } = _decorator;

@ccclass('OCo')
export class OCo extends Component {

    public hang = 0;
    public cot = 0;

    private hienThiMesh: MeshRenderer | null = null;
    private vatLieu: Material | null = null;
    private readonly mauBinhThuong = new Color(200, 200, 200, 255);
    private readonly mauDangChon = new Color(255, 0, 0, 255);
    private readonly mauNuocDiHopLe = new Color(0, 200, 80, 255);

    onLoad() {
        this.luuVatLieu();
        this.datLaiMau();
    }

    public khoiTao(hang: number, cot: number) {
        this.hang = hang;
        this.cot = cot;
    }

    public chon() {
        this.doiMauOCo(this.mauDangChon);
    }

    public hienNuocDiHopLe() {
        this.doiMauOCo(this.mauNuocDiHopLe);
    }

    public datLaiMau() {
        this.doiMauOCo(this.mauBinhThuong);
    }

    private luuVatLieu() {
        this.hienThiMesh = this.getComponent(MeshRenderer);

        if (this.hienThiMesh) {
            this.vatLieu = this.hienThiMesh.getMaterialInstance(0);
        }
    }

    private doiMauOCo(mau: Color) {
        if (!this.vatLieu) {
            this.luuVatLieu();
        }

        if (this.vatLieu) {
            this.vatLieu.setProperty('mainColor', mau);
        }
    }
}
