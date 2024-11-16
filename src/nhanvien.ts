import mongoose, { Schema, Document } from "mongoose";


export interface INhanVien extends Document {
  maNhanVien: string;
  hoTen: string;
  soDienThoai: string;
  ngaySinh: Date;
  matKhau: string;
}


const NhanVienSchema: Schema = new Schema({
  maNhanVien: { type: String, required: true, unique: true }, 
  hoTen: { type: String, required: true },                   
  soDienThoai: { type: String, required: true, unique: true }, 
  ngaySinh: { type: Date, required: true },                
  matKhau: { type: String, required: true },                
});


export default mongoose.model<INhanVien>("NhanVien", NhanVienSchema);
