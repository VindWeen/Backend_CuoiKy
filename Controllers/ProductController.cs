using Backend_CuoiKy.Models;
using Backend_CuoiKy.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;


namespace Backend_CuoiKy.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _service;

        public ProductController(IProductService service)
        {
            _service = service;
        }

        // GET api/product
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        // GET api/product/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _service.GetByIdAsync(id);
            if (product == null)
                return NotFound();

            return Ok(product);
        }

        // POST api/product
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(Product product)
        {
            var newP = await _service.AddAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = newP.Id }, newP);
        }

        // PUT api/product/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Product product)
        {
            var updated = await _service.UpdateAsync(id, product);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        // DELETE api/product/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
