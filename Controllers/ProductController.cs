using Backend_CuoiKy.Data;
using Backend_CuoiKy.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_CuoiKy.Controllers
{
    // [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProductController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/product
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.Product.ToListAsync();
            return Ok(list);
        }

        // GET api/product/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _db.Product.FindAsync(id);
            if (product == null)
                return NotFound();

            return Ok(product);
        }

        // POST api/product
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] Product product, IFormFile? file)
        {
            _db.Product.Add(product);
            await _db.SaveChangesAsync(); // ID tự sinh ra

            if (file != null && file.Length > 0)
            {
                var savePath = Path.Combine(Directory.GetCurrentDirectory(), "Images", $"{product.Id}.jpg");
                using var stream = new FileStream(savePath, FileMode.Create);
                await file.CopyToAsync(stream);
            }

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        // PUT api/product/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] Product product, IFormFile? file)
        {
            var existing = await _db.Product.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = product.Name;
            existing.Price = product.Price;
            existing.Description = product.Description;
            existing.Stock = product.Stock;

            await _db.SaveChangesAsync();

            if (file != null && file.Length > 0)
            {
                var savePath = Path.Combine(Directory.GetCurrentDirectory(), "Images", $"{id}.jpg");
                using var stream = new FileStream(savePath, FileMode.Create);
                await file.CopyToAsync(stream);
            }

            return Ok(existing);
        }


        // DELETE api/product/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _db.Product.FindAsync(id);
            if (product == null) return NotFound();

            _db.Product.Remove(product);
            await _db.SaveChangesAsync();

            // Xóa file ảnh nếu tồn tại
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Images", $"{id}.jpg");
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

            return NoContent();
        }


        [Authorize(Roles = "Admin")]
        [HttpPost("upload/{id}")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            var product = await _db.Product.FindAsync(id);
            if (product == null) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("File không hợp lệ");

            var savePath = Path.Combine(Directory.GetCurrentDirectory(), "Images", $"{id}.jpg");
            using var stream = new FileStream(savePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return Ok(new { message = "Upload thành công" });
        }



    }
}
